var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')

module.exports = {

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
                resolve(users)
            } catch (error) {
                reject(error)
            }
        })
    },
    blockUSer: (userId) => {
        console.log(userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId) }, {
                    $set: {
                        isBlocked: true
                    }
                }).then((response) => {
                    console.log("hellooooooooooooo")
                    resolve(response);
                })

        })
    },
    unblockUSer: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId) }, {
                    $set: {
                        isBlocked: false
                    }
                }).then((response) => {
                    console.log("hellooooooooooooo")
                    resolve(response);
                })

        })
    },
    getAllOrders: () => {
        return new Promise((resolve, reject) => {
            let orders = db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'orders'
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $project:{
                        _id:1,date:1,username:'$orders.username',totalAmount:1,status:1,paymentMethod:1
                    }
                },
                {
                    $sort:{_id:-1}
                }
            ]).toArray()
            resolve(orders)
        })
    },

    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        'products.item': 1,paymentMethod:1, status: 1, date: 1, quantity: '$products.quantity', productname: '$product.name', price: '$product.MRP',
                        quantitytotal: { $multiply: ['$products.quantity', { $toInt: '$product.MRP' }] }, productimage: { $arrayElemAt: ['$product.img', 0] },
                        offer: '$product.discount.percent', discount: { $multiply: ['$products.quantity', { $multiply: ['$products.MRP', { $divide: ['$products.offer', 100] }] }] },
                        couponDiscount:1
                    }
                }
            ]).toArray()

            let address = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $lookup: {
                        from: collection.ADDRESS_COLLECTION,
                        localField: 'addressId',
                        foreignField: '_id',
                        as: 'address'
                    }
                },
                {
                    $unwind: '$address'
                },
                {
                    $project: { address: 1 }
                },
                {
                    $project: {
                        name: '$address.name', fullAddress: '$address.fullAddress', zip: '$address.zip',
                        phone: '$address.phone', email: '$address.email'
                    }
                }
            ]).toArray()

            let subTotal = 0
            let discountTotal = 0
            for (let i = 0; i < orderItems.length; i++) {
                subTotal += orderItems[i].quantitytotal
                discountTotal += orderItems[i].discount
            }
            let grandTotal = parseInt(subTotal - (discountTotal+orderItems[0].couponDiscount))
            let totals = {
                subTotal: Math.round(subTotal),
                discountTotal: Math.round(discountTotal),
                grandTotal: Math.round(grandTotal),
                couponDiscount:orderItems[0].couponDiscount
            }
            console.log(totals);
            console.log(address);
            console.log(orderItems);

            resolve({orderItems,address,totals})
        })
    },


} 