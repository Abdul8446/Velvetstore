var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (product, callback) => {
        product.stock = parseInt(product.stock)
        product.MRP = parseInt(product.MRP)
        let status = {
            discount: {
                status: false,
                percent: 0
            }
        }
        let productObj = {
            ...product, ...status
        }
        console.log(product);
        db.get().collection('product').insertOne(productObj).then((data) => {
            callback(data)
        })
    },
    getAllProducts: (page, limit) => {
        limit = parseInt(limit)
        let skipQuantity = 6 * (page - 1)
        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().skip(skipQuantity).limit(limit).toArray()
            let prodCount = await db.get().collection(collection.PRODUCT_COLLECTION).find().count()
            let pageLimit = parseInt(prodCount) / limit
            let pageNum = []
            for (let i = 0; i < pageLimit; i++) {
                pageNum[i] = i + 1
            }
            console.log(pageNum);
            resolve({ products, pageNum })
        })
    },
    deleteProduct: (prodId) => {
        console.log(prodId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (prodId, prodDetails) => {
        return new Promise(async (resolve, reject) => {
            let img = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) })
            if (prodDetails.img.length == 0) {
                prodDetails.img = img.img
            }
            console.log('===========================================');
            console.log(prodDetails.img);
            console.log('===========================================');

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                $set: {
                    name: prodDetails.name,
                    description: prodDetails.description,
                    price: prodDetails.price,
                    img: prodDetails.img
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    addStock: (details) => {
        quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(details.prodId) }, { $inc: { 'stock': quantity } })
                .then(() => {
                    resolve()
                })
        })
    },
    updateDiscount: (details) => {
        MRP = parseInt(details.MRP)
        discount = parseInt(details.discount)
        let offerPrice = parseInt(MRP - (discount / 100 * MRP))
        console.log(MRP);
        console.log(discount);
        console.log(offerPrice);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).
                updateOne({ _id: objectId(details.prodId) }, {
                    $set: {
                        'discount': {
                            status: true,
                            percent: discount
                        },
                        'offerPrice': offerPrice
                    }
                })
                .then(() => {
                    resolve()
                })
        })
    },
    getProductsByCategory: (details) => {
        limit = parseInt(details.limit)
        let skipQuantity = 6
        if (details.page == 1) {
            skipQuantity = 0
        }

        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ categoryId: details.catId }).skip(skipQuantity).limit(limit).toArray()
            let prodCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ categoryId: details.catId }).count()
            let pageLimit = parseInt(prodCount) / details.limit
            let pageNum = []
            for (let i = 0; i < pageLimit; i++) {
                pageNum[i] = i + 1
            }


            resolve({ products, pageNum })
        })
    },
    getProductsBySubCategory: (details) => {
        console.log(details.subCat)
        console.log(details.catId);
        console.log(details.page);
        console.log(details.limit);
        limit = parseInt(details.limit)
        let skipQuantity = 6
        if (details.page == 1) {
            skipQuantity = 0
        }

        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ categoryId: details.catId, subCategory: details.subCat }).skip(skipQuantity).limit(limit).toArray()
            let prodCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ categoryId: details.catId, subCategory: details.subCat }).count()
            let pageLimit = parseInt(prodCount) / details.limit
            let pageNum = []
            for (let i = 0; i < pageLimit; i++) {
                pageNum[i] = i + 1
            }


            resolve({ products, pageNum })
        })
    },
    addCoupon: (couponDetails) => {
        return new Promise((resolve, reject) => {
            console.log(couponDetails)
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponDetails).then((data) => {
                resolve(data.insertedId);
            })
        })
    },
    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },
    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) })
            resolve()
        })
    },
    findCoupon: (coupon, user) => {
        return new Promise(async (resolve, reject) => {
            let couponExist = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: coupon })
            let response = {};
            if (couponExist) {
                let userCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: coupon, user: { $in: [objectId(user._id)] } })
                if (userCheck) {
                    response.used = true;
                    resolve(response)
                } else {
                    date = new Date()
                    expdate = new Date(couponExist.date)
                    if (date <= expdate) {
                        console.log("%%%%%%%%%")
                        db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon: coupon },
                            {
                                $push: { user: objectId(user._id) }
                            }).then((response) => {
                                db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(user._id) },
                                    {
                                        $set: { coupon: coupon }
                                    })
                                response.a = couponExist
                                resolve(response)
                            })
                    } else {
                        response.dateExpired = true
                        resolve(response)
                    }
                }
            } else {
                console.log('Invalid coupon')
                response.invalid = true
                resolve(response)
            }
        })
    }
} 