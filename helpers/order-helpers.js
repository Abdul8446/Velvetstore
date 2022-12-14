var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId

module.exports = {

    cancelOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let prods = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: { _id: 0, 'products.item': 1, 'products.quantity': 1 }
                }
            ]).toArray()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'cancelled' }
                }).then(() => {
                    for (let i = 0; i < prods.length; i++) {
                        console.log(prods[i]);
                        console.log(prods[i].products.item);
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new objectId(prods[i].products.item) },
                            {
                                $inc: { stock: prods[i].products.quantity }
                            })
                    }
                    resolve()
                })
        })

    },
    reOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let prods = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: { _id: 0, 'products.item': 1, 'products.quantity': 1 }
                }
            ]).toArray()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'placed' }
                }).then(() => {
                    for (let i = 0; i < prods.length; i++) {
                        console.log(prods[i]);
                        console.log(prods[i].products.item);
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new objectId(prods[i].products.item) },
                            {
                                $inc: { stock: -Math.abs(prods[i].products.quantity) }
                            })
                    }
                    resolve()
                })
        })
    },
    itemDelivered: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'delivered' }
                }).then(() => {
                    resolve()
                })
        })
    },
    itemShipped: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'shipped' }
                }).then(() => {
                    resolve()
                })
        })
    },
    itemOutForDelivery: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'out for delivery' }
                }).then(() => {
                    resolve()
                })
        })
    },
    itemReturn: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'return approval pending' }
                }).then(() => {
                    resolve()
                })
        })
    },
    orderApproveReturn: (orderId,userId) => {
        return new Promise(async (resolve, reject) => {
            let prods = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: { _id: 0, 'products.item': 1, 'products.quantity': 1 ,totalAmount:1}
                }
            ]).toArray()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'returned' }
                }).then(() => {
                    for (let i = 0; i < prods.length; i++) {
                        console.log(prods[i]);
                        console.log(prods[i].products.item);
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new objectId(prods[i].products.item) },
                            {
                                $inc: { stock: prods[i].products.quantity }
                            })
                    }
                    db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                        $inc:{walletbalance:prods[0].totalAmount}
                    })
                    resolve()
                })
        })

    }
}