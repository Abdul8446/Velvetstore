var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
module.exports = {
    addCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((response) => {
                resolve(response)
            })
        })
    },
    getAllCategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })

    },
    addSubCategory: (subCategory) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: objectId(subCategory.categoryId) }, {
                    $push: {
                        subCategories:
                            { name: subCategory.name, discount: 0, discountStatus: false }
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    getSubCategories: (categoryId) => {
        return new Promise((resolve, reject) => {
            let subCategories = db.get().collection(collection.CATEGORY_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(categoryId) }
                },
                {
                    $unwind: '$subCategories'
                },
                {
                    $project: { name: '$subCategories.name', discount: '$subCategories.discount' }
                },
            ]).toArray()
            resolve(subCategories)
        })
    },
    deleteSubCategory: (details) => {
        try {

            let catId = details.catId
            let subCatName = details.subCatName
            console.log(catId);
            console.log(subCatName);
            return new Promise((resolve, reject) => {
                db.get().collection(collection.CATEGORY_COLLECTION)
                    .updateOne({ _id: objectId(catId) }, { $pull: { subCategories: { name: subCatName } } })
                    .then((response) => {
                        console.log(response);
                        resolve(response)
                    })
            })
        } catch (error) {
            console.log(error);
        }

    },
    updateSubCategory: (details) => {
        let catId = details.catId
        let catName = details.catName
        let catPrev = details.catPrev
        console.log(details.catId);
        console.log(details.catName)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: objectId(catId), 'subCategories': catPrev }, { $set: { 'subCategories.$': catName } }).then(() => {
                    resolve()
                })
        })
    },
    checkDuplicateCategory: (catName) => {
        try {
            return new Promise(async (resolve, reject) => {
                let duplicate = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: { '$regex': '^' + catName + '$', '$options': 'i' } })
                if (duplicate) {
                    console.log('===============================================================');
                    console.log(duplicate);
                    resolve()
                } else {
                    console.log('===============================================================');
                    console.log(duplicate);
                    reject()
                }
            })
        } catch (err) {
            console.log(err);
        }
    },
    checkDuplicateSubCategory: (subCatName, catId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let duplicate = await db.get().collection(collection.CATEGORY_COLLECTION)
                    .findOne({ _id: objectId(catId), subCategories: { '$regex': '^' + subCatName + '$', '$options': 'i' } })
                if (duplicate) {
                    console.log('===============================================================');
                    console.log(duplicate);
                    resolve()
                } else {
                    console.log('===============================================================');
                    console.log(duplicate);
                    reject()
                }
            })
        } catch (err) {
            console.log(err);
        }
    },
    updateDiscountSubCat: (details) => {
        try {
            let subCatDiscount = parseInt(details.discount)
            let subCatName = details.subCatName
            let catId = details.catId
            let index = details.index

            return new Promise(async (resolve, reject) => {
                let subCatOffer = (100 - subCatDiscount) / 100

                let MRP = await db.get().collection(collection.PRODUCT_COLLECTION)
                    .aggregate([{ $match: { subCategory: subCatName } }, { $project: { subCatOfferPrice: { $toInt: { $multiply: ['$MRP', subCatOffer] } } } }]).toArray()
                console.log('============================')
                console.log(MRP);
                console.log('==============================')

                if (subCatDiscount == 0) {
                    db.get().collection(collection.PRODUCT_COLLECTION).update({ subCategory: subCatName }, {
                        $set: {
                            subCatDiscount: {
                                percent: subCatDiscount,
                                status: false
                            }
                        }
                    }).then(async() => {
                        for (let i = 0; i < MRP.length; i++) {
                            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ subCategory: subCatName, _id: MRP[i]._id }, {
                                $set: { subCatOfferPrice:0 }
                            })
                        }
                        db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, {
                            $set: { ['subCategories.' + index + '.discount']: subCatDiscount }
                        }).then(() => {
                            resolve()
                        })
                    })
                } else {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ subCategory: subCatName }, {
                        $set: {
                            subCatDiscount: {
                                percent: subCatDiscount,
                                status: true
                            }
                        }
                    }).then(async () => {
                        for (let i = 0; i < MRP.length; i++) {
                            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ subCategory: subCatName, _id: MRP[i]._id }, {
                                $set: { subCatOfferPrice: MRP[i].subCatOfferPrice }
                            })
                        }
                        db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, {
                            $set: { ['subCategories.' + index + '.discount']: subCatDiscount }
                        }).then(() => {
                            resolve()
                        })
                    })

                }

            })
          
        } catch (error) {
            console.log(error);
        }
    }
}