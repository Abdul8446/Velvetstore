var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_tz4E3kt3VHHhmt',
    key_secret: '5kSfmWHKIffOYa7m7y8mwrnc'
})





module.exports = {
    doSignup: (userData) => {
        let response={}
        return new Promise(async (resolve, reject) => {
            let emailFind=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            let phoneFind=await db.get().collection(collection.USER_COLLECTION).findOne({phone:userData.phone})
            let referralFind=await db.get().collection(collection.USER_COLLECTION).findOne({referral:userData.referral})
            if(emailFind){
                response.emailError=true
                resolve(response)
            }else if(phoneFind){
                response.phoneError=true 
                resolve(response) 
            }else if(referralFind){
                await db.get().collection(collection.USER_COLLECTION).updateOne({referral:userData.referral},{$inc:{walletbalance:100}})
                userData.walletbalance=50
                userData.referral=userData.username.toUpperCase()
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve(data)
                })
            }else{
                userData.walletbalance=0
                userData.referral=userData.username.toUpperCase()
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve(data)
                })
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    console.log(status);
                    if (user.isBlocked == true) {
                        console.log('user blocked');
                        response.blocked = true;
                        resolve(response)
                    }
                    else {
                        if (status) {
                            console.log('login success');
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            console.log('login failed');
                            resolve({ status: false })

                        }

                    }
                })
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })
    },
    phoneCheck: (phoneNum) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            console.log(phoneNum.phone);
            let mobileFind = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: phoneNum.phone })
            // console.log(mobileFind);
            if (mobileFind) {
                if (mobileFind.isBlocked) {
                    response.userBlocked = true
                    resolve(response)
                } else {
                    response.user = mobileFind
                    resolve(response)
                }
            } else {
                response.mobileErr = true
                resolve(response)
            }
        })
    },
    getUsersByPhoneNumber: (phoneNum) => {
        return new Promise(async (resolve, reject) => {
            userDetails = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: phoneNum })
            console.log(userDetails);
            resolve(userDetails)
        })
    },
    addToCart: (prodId, userId) => {
        try {      
            return new Promise(async (resolve, reject) => {
                let productPrice = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) })
                console.log(productPrice);        
                let price;
                let offer;
                if (productPrice.discount.status) {
                    if(productPrice.subCatDiscount.status){
                        if(productPrice.subCatDiscount.percent>=productPrice.discount.percent){
                            price=productPrice.subCatOfferPrice
                            offer=productPrice.subCatDiscount.percent
                        }else{
                            price=productPrice.offerPrice
                            offer=productPrice.discount.percent
                        }
                    }else{
                        price = productPrice.offerPrice
                        offer = productPrice.discount.percent
                    }
                } else {
                    if(productPrice.subCatDiscount.status){
                        price = productPrice.subCatOfferPrice
                        offer = productPrice.subCatDiscount.percent
                    }else{
                        price = productPrice.MRP
                        offer = 0
                    }
                }
                console.log(price);
                let prodObj = {
                    item: objectId(prodId),
                    MRP:productPrice.MRP,
                    quantity: 1,
                    price: price,
                    offer: offer
                }
                let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                if (userCart) {
                    let prodExist = userCart.products.findIndex(product => product.item == prodId)
                    console.log(prodExist);
                    if (prodExist != -1) {
                        db.get().collection(collection.CART_COLLECTION)
                            .updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                                {
                                    $inc: { 'products.$.quantity': 1 }
                                }
                            ).then(() => {
                                resolve()
                            })
                    } else {
                        console.log('-------------------------------cart exist');
                        db.get().collection(collection.CART_COLLECTION)
                            .updateOne({ user: objectId(userId) },
                                {
                                    $push: { products: prodObj }
                                }
                            ).then((response) => {
                                resolve()
                            })
                    }
                } else {
                    console.log('-------------------------------no cart');
                    console.log('product id:  ' + prodId + 'userId:  ' + userId);
                    let cartObj = {
                        user: objectId(userId),
                        products: [prodObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                        resolve()
                    })
                }
    
            })
        } catch (error) {
            console.log(error)
        }
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: 1, quantity: 1, discount: 1, product: 1,
                        totalMRP: { $multiply: ['$product.MRP', '$quantity'] }, totalOfferPrice: { $multiply: ['$product.offerPrice', '$quantity'] },
                        totalSubCatOfferPrice: { $multiply: ['$product.subCatOfferPrice', '$quantity'] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
                console.log('cart count============================================================' + count);
            }
            resolve(count)
        })
    },
    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishCount = await db.get().collection(collection.WISHLIST_COLLECTION).find({ user: objectId(userId) }).count()
            resolve(wishCount)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: [{ $toInt: '$quantity' }, {
                                    $subtract: [
                                        { $toInt: '$product.MRP' },
                                        {
                                            $multiply: [
                                                '$product.MRP',
                                                { $divide: [{ $cond: { if: { $gte: [ '$product.subCatDiscount.percent', '$product.discount.percent' ] },
                                                 then: '$product.subCatDiscount.percent', else: '$product.discount.percent' } }, 100] }
                                            ]
                                        }
                                    ]
                                }]
                            }
                        }
                    }
                }
            ]).toArray()
            // console.log(total);
            resolve(total)
        })
    },
    placeOrder: (order, products, total) => {
        let totalAmount = parseInt(total[0].total)
        if(order.couponDiscount){
            totalAmount =totalAmount-order.couponDiscount
        }
        console.log('=o========================' + totalAmount+'discount'+order.couponDiscount);
        return new Promise((resolve, reject) => {
            var today = new Date();
            var date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                userId: objectId(order.userId),
                addressId: objectId(order.address),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: totalAmount,
                couponDiscount:parseInt(order.couponDiscount),
                date: date,
                status: status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                for (i = 0; i < products.length; i++) {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: products[i].item },
                        {
                            $inc: { stock: -Math.abs(products[i].quantity) }
                        })
                }
                resolve(response.insertedId)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log('=============================');
            console.log(cart.products);
            resolve(cart.products)
        })
    },
    addAddress: (address) => {
        return new Promise(async (resolve, reject) => {
            let addressObj = {
                userId: objectId(address.userId),
                name: address.firstname + ' ' + address.lastname,
                fullAddress: address.street + ',' + address.town + ',' + address.state + ',' + address.country,
                zip: address.zip,
                phone: address.phone,
                email: address.email,
            }
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj).then((response) => {
                resolve(response)
            })
        })
    },
    getAllAddresses: (userId) => {
        return new Promise(async (resolve, reject) => {
            let addresses = await db.get().collection(collection.ADDRESS_COLLECTION).find({ userId: objectId(userId) }).toArray()
            resolve(addresses)
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: objectId(userId) }
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
                    $sort: { _id: -1 }
                }

            ]).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
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
                        'products.item': 1, status: 1, date: 1, quantity: '$products.quantity', productname: '$product.name', price: '$product.MRP',
                        quantitytotal: { $multiply: ['$products.quantity', { $toInt: '$product.MRP' }] }, productimage: { $arrayElemAt: ['$product.img', 0] },
                        offer: '$products.offer', discount: { $multiply: ['$products.quantity', { $multiply: ['$products.MRP', { $divide: ['$products.offer', 100] }] }] },
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
    addToWishlist: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            let prodObj = {
                user: objectId(userId),
                productId: objectId(prodId)
            }
            db.get().collection(collection.WISHLIST_COLLECTION).insertOne(prodObj)
                .then(() => {
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $push: { wishlist: prodId } })
                    resolve()
                })
        })
    },
    removeFromWishlist: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).deleteOne({ productId: objectId(prodId), user: objectId(userId) }).then(() => {
                resolve()
            })
        })
    },
    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        user: 1, productId: 1, name: '$products.name', MRP: '$products.MRP',
                        offerPrice: '$products.offerPrice', discount: '$products.discount', img: '$products.img',
                        subCatDiscount:'$products.subCatDiscount',subCatOfferPrice:'$products.subCatOfferPrice',
                        stock:'$products.stock'   
                    }
                }
            ]).toArray()
            resolve(products)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            console.log(orderId);
            console.log('-------------------------' + total);
            var options = {
                amount: parseInt(total) * 100,//amount in the smallest currency unit
                currency: 'INR',
                receipt: '' + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                    // console.log(total)   
                } else {
                    console.log(order)
                    resolve(order)
                }
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', '5kSfmWHKIffOYa7m7y8mwrnc')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne(
                { _id: objectId(orderId) },
                { $set: { status: 'placed' } }
            ).then(() => {
                resolve()
            })
        })
    },
    getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(user)

        })

    },

    updateUserDetails: (userId, updateUserDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOneAndUpdate({ _id: objectId(userId) }, {
                $set: {
                    username: updateUserDetails.username,
                    email: updateUserDetails.email,
                    phonenumber: updateUserDetails.phonenumber

                }
            }).then((response) => {
                resolve()
            })

        })
    },

    changePassword: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let password = await bcrypt.hash(userData.confirmPassword, 10);
                db.get().collection(collection.USER_COLLECTION).updateOne({ email: userData.email },
                    {
                        $set: { password: password }
                    }).then(() => {
                        console.log("password changed successfully");
                        resolve()
                    })
            } catch (error) {
                console.log(error);
            }
        })
    },
    passwordCheck: (details) => {
        return new Promise(async (resolve, reject) => {
            try {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(details.userId) })
                if (user) {
                    bcrypt.compare(details.checkingPassword, user.password).then((status) => {
                        if (status) {
                            resolve()
                        } else {
                            reject()
                        }
                    })
                }
            } catch (error) {
                console.log(error);
            }
        })
    },
    getWalletBalance:(userId)=>{
        try {        
            return new Promise(async(resolve,reject)=>{
                let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
                console.log(user.walletbalance+'===============================')
                resolve(user)
            })
        } catch (error) {
            console.log(error)
        }
    },
    checkCoupon: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart)
        })
    },
    checkCouponExist: (couponname) => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: couponname })
            resolve(coupon)
        })
    },
    removeCoupon: (userId, coupon) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon: coupon }, {
                $pull: { user: objectId(userId) }
            }).then(() => {

                db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                    $unset: { coupon: coupon }
                })

            })
        })
    },
}

