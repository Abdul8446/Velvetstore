const { response, request } = require('../app');
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const orderHelpers = require('../helpers/order-helpers')
const otpConfig = require('../config/otp-config')
const CC = require('currency-converter-lt')
const client = require("twilio")(otpConfig.accoutSid, otpConfig.authToken);
let blockStatus;
const paypal = require('paypal-rest-sdk')
paypal.configure({
    'mode': 'sandbox',
    'client_id': 'AYzWmk8uVrNGA9E9VQd2pfNlsgo7HH75Y4AbYXMEwljzyTBhZVVSfSZqYw4hKUss92x4_9OQrDti1EOC',
    'client_secret': 'EL10uU0iHI0KtghrWdgHPo1gGIMDiSOeelSO00Ynelm5JPv-OQjQhVSgXixTBXJZ-VnPS0IHbeE937Jp'
})
var passwordChangeSuccess

const userHome = async (req, res, next) => {
    let user = req.session.user
    console.log(user);
    let cartCount = null
    let wishCount = null
    if (user) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        wishCount = await userHelpers.getWishCount(req.session.user._id)
    }
    if (req.session.userLoggedIn) {
        console.log(cartCount);
        res.render('index', { user, userExist: true, cartCount, wishCount });
    } else {
        res.render('index', { userExist: true });
    }
}


const userLogin = (req, res) => {
    if (req.session.userLoggedIn) {
        res.redirect('/')
    } else {
        res.render('user/login', { userExist: true, loginErr: req.session.userLoginErr, blockStatus })
        req.session.userLoginErr = false
        blockStatus = false
    }
}

const userLoggedin = (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
        console.log(response)
        if (response.blocked == true) {
            blockStatus = true
            res.redirect('/login')
        } else {
            if (response.status) {
                req.session.userLoggedIn = true
                req.session.user = response.user
                res.redirect('/')
            } else {
                req.session.userLoginErr = true
                res.redirect('/login')
            }

        }

    })
}

const userSignup = (req, res) => {
    if (req.session.userLoggedIn) {
        res.redirect('/')
    } else {
        res.render('user/signup', { userExist: true, emailError: req.session.emailError, phoneError: req.session.phoneError })
        req.session.emailError = false
        req.session.phoneError = false
    }
}

const userSignedup = (req, res) => {
    userHelpers.doSignup(req.body).then((response) => {
        console.log('===========================');
        console.log(response);
        console.log('===========================');

        if (response.emailError) {
            req.session.emailError = true
            res.redirect('/signup')
        } else if (response.phoneError) {
            req.session.phoneError = true
            res.redirect('/signup')
        } else {
            console.log(response);
            res.redirect('/login')
        }
    })
}

const userLogout = (req, res) => {
    req.session.userLoggedIn = false
    res.redirect('/')
}


const otpLogin = (req, res) => {
    // if(request.session.userLoggedIn){
    //     res.redirect('/')
    // }else{
    res.render('user/otp-login', { userExist: true, mobileNotFoundErr: req.session.mobileNotFoundErr, userBlocked: req.session.userBlocked })
    req.session.userBlocked = false
    req.session.mobileNotFoundErr = false
    // }
}

const sendCode = (req, res) => {
    userHelpers.phoneCheck(req.body).then((response) => {
        console.log('-----------------------------sendcode');
        console.log(response);
        if (response.user) {
            if (response.userBlocked) {
                req.session.userBlocked = true
                res.redirect('/otp-login')
            } else {
                req.session.phone = response.user.phone
                client.verify.services(otpConfig.serviceSid)
                    .verifications
                    .create({ to: '+91' + req.session.phone, channel: 'sms' })
                    .then(verification => console.log(verification.status));
                res.redirect('/verify-otp')
            }
        } else {
            req.session.mobileNotFoundErr = true
            res.redirect('/otp-login')
        }
    })
}


const verifyOtp = (req, res) => {
    console.log(req.session.phone + '-------------------------in verifyotp');
    res.render('user/verify-otp', { userExist: true, invalidOtp: req.session.invalidOtp, defaultInput: req.session.phone })
    req.session.invalidOtp = false
}

const verifiedOtp = async (req, res) => {
    let otp = req.body.otp
    console.log('-------------------------otp' + otp);
    console.log('--------------------------verifiedOtp' + req.session.phone);
    let userDetails = await userHelpers.getUsersByPhoneNumber(req.session.phone)
    await client.verify.services(otpConfig.serviceSid)
        .verificationChecks
        .create({ to: `+91${req.session.phone}`, code: otp })
        .then((response) => {
            if (response.status === "approved") {
                console.log('----------------------otp valid');
                req.session.userLoggedIn = true
                req.session.user = userDetails
                res.redirect('/')
            } else {
                console.log('------------------------otp invalid');
                req.session.invalidOtp = true
                res.redirect('/verify-otp')
            }
        })
}

// =======================================SHOPPING PAGE============================================================


const shop = async (req, res) => {
    let wishCount = null
    let cartCount = null
    let wishlistId
    let productId
    let results = {}
    results.products = await productHelpers.getAllProducts(req.query.page, req.query.limit)
    if (req.session.userLoggedIn) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        wishCount = await userHelpers.getWishCount(req.session.user._id)
        let wishlist = await userHelpers.getWishlistProducts(req.session.user._id)
        if (wishlist) {
            for (i = 0; i < wishlist.length; i++) {
                for (j = 0; j < results.products.products.length; j++) {
                    wishlistId = wishlist[i].productId.toString()
                    productId = results.products.products[j]._id.toString()
                    if (wishlistId == productId) {
                        results.products.products[j].inWishlist = true
                    }
                }
            }
        }
    }

    let categories = await categoryHelpers.getAllCategories()
    productHelpers.getAllProducts(req.query.page, req.query.limit).then((data) => {
        let products = results.products.products
        let pageNum = results.products.pageNum

        console.log('=============================================================')
        console.log(products)
        console.log('=============================================================')

        res.render('user/shop', {page:req.query.page, user: req.session.user, pageNum, products, proDetails: true, cartCount, categories, wishCount })
    })
}


const getSub_Categories = (req, res) => {
    categoryHelpers.getSubCategories(req.params.id).then((subs) => {
        console.log(subs);
        res.json(subs)
    })
}

const getProductsBy_Category = async (req, res) => {
    let wishCount = null
    let cartCount = null
    if (req.session.userLoggedIn) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        wishCount = await userHelpers.getWishCount(req.session.user._id)
    }
    let categories = await categoryHelpers.getAllCategories()
    productHelpers.getProductsByCategory({ catId: req.query.id, page: req.query.page, limit: req.query.limit }).then((data) => {
        let products = data.products
        let pageNum = data.pageNum
        console.log(products);
        res.render('user/shopbycategory', { user: req.session.user, pageNum, products, proDetails: true, cartCount, categories, wishCount })
    })
}

const getProductsBy_SubCategory = async (req, res) => {
    let wishCount = null
    let cartCount = null
    if (req.session.userLoggedIn) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        wishCount = await userHelpers.getWishCount(req.session.user._id)
    }
    let categories = await categoryHelpers.getAllCategories()
    productHelpers.getProductsBySubCategory({ catId: req.query.id, subCat: req.query.subCat, page: req.query.page, limit: req.query.limit }).then((data) => {
        let products = data.products
        let pageNum = data.pageNum
        console.log(products);
        res.render('user/shopbysubcategory', { user: req.session.user, pageNum, products, proDetails: true, cartCount, categories, wishCount })
    })
}

const productDetails = async (req, res) => {
    let cartCount = null
    let wishCount = null
    if (req.session.userLoggedIn) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        wishCount = await userHelpers.getWishCount(req.session.user._id)
    }
    let product = await productHelpers.getProductDetails(req.params.id)
    console.log(product);
    res.render('user/product-details', { user: req.session.user, product, proDetails: true, cartCount, wishCount })
}

const addTo_Cart = (req, res) => {
    console.log('api call');
    console.log(req.params.id);
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true })
    })
}

const addTo_Wishlist = (req, res) => {
    console.log('api call');
    userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true })
    })
}

const removeFrom_Wishlist = (req, res) => {
    console.log('api call');
    userHelpers.removeFromWishlist(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true })
    })
}

const cart = async (req, res) => {
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    let wishCount = await userHelpers.getWishCount(req.session.user._id)
    let products = "";
    let totalValue = "";
    if (cartCount != 0) {
        products = await userHelpers.getCartProducts(req.session.user._id)
        totalValue = await userHelpers.getTotalAmount(req.session.user._id)
        totalValue = Math.round(totalValue[0].total)

        // console.log(products);
        //  console.log(totalValue);
        res.render('user/cart', { products, user: req.session.user, userExist: true, totalValue, cartCount, wishCount })
    } else {
        res.render('user/cart', { user: req.session.user, userExist: true, cartCount })
    }
}

const wishlist = async (req, res) => {
    let cartCount = null
    if (req.session.userLoggedIn) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
    let wishCount = await userHelpers.getWishCount(req.session.user._id)
    let products = await userHelpers.getWishlistProducts(req.session.user._id)
    console.log(products);
    console.log(wishCount);
    res.render('user/wishlist', { products, user: req.session.user, userExist: true, wishCount, cartCount })
}

const changeProduct_Quantity = async (req, res, next) => {
    console.log(req.body);
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    // if(cartCount!=0){  
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
        response.total = await userHelpers.getTotalAmount(req.body.user)
        console.log(cartCount);
        res.json(response)
    })
    // }
}

const checkoutPage = async (req, res) => {
    user = req.session.user
    if (user) {
        cartCount = await userHelpers.getCartCount(user._id)
        totalPrice = await userHelpers.getTotalAmount(user._id)
        subtotal = parseInt(totalPrice[0].total)
        finalAmount = parseInt(totalPrice[0].total)
        let cart = await userHelpers.checkCoupon(user._id)
        let coupon = await userHelpers.checkCouponExist(cart.coupon)
        if (cart.coupon) {
            let discount = finalAmount / 100 * parseInt(coupon.discount)
            finalAmount = parseInt(finalAmount - discount)
        }
        discountedPrice = subtotal - finalAmount
        couponname = cart.coupon
    }
    let address = await userHelpers.getAllAddresses(req.session.user._id)
    res.render('user/checkout', { couponname, address, user: req.session.user, finalAmount, subtotal, discountedPrice, cartCount, userExist: true, })
    // let totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
    // totalAmount = Math.round(totalAmount[0].total)
    // console.log('===========================' + totalAmount);
    // console.log(address)
    // res.render('user/checkout', { userExist: true, user: req.session.user, totalAmount, address })
}
// const checkOut = async (req, res) => {
//     user = req.session.user
//     if (user) {
//         cartCount = await userhelper.getCartCount(user._id)
//         totalPrice = await userhelper.getTotalAmount(user._id)
//         subtotal = totalPrice[0].subtotal
//         finalAmount = totalPrice[0].subtotal
//         let cart = await userhelper.checkCoupon(user._id)
//         let coupon = await userhelper.checkCouponExist(cart.coupon)
//         if (cart.coupon) {
//             let discount = finalAmount / 100 * parseInt(coupon.discount)
//             finalAmount = parseInt(finalAmount - discount)
//         }
//         discountedPrice = subtotal - finalAmount
//         couponname = cart.coupon
//     }
//     let address = await addresshelper.getUserAddress(user._id)
//     let products = await userhelper.getCartProducts(user)
//     res.render('user/checkout', { couponname, address, user: req.session.user, finalAmount, subtotal, discountedPrice, cartCount, products, userheader: true, })
// }

const place_order = async (req, res) => {
    let products = await userHelpers.getCartProductList(req.body.userId)
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
        if (req.body['payment-method'] === 'COD') {
            res.json({ codSuccess: true })
        } else if (req.body['payment-method'] === 'PAYPAL') {
            res.json({ paypal: true, orderId })
            // let converter = new CC({
            //     from: "INR",
            //     to: 'USD',
            //     amount: totalPrice[0].total
            // })
        } else {
            userHelpers.generateRazorpay(orderId, totalPrice[0].total).then((response) => {
                res.json(response)
            })
        }
    })
}

const add_address = (req, res) => {
    userHelpers.addAddress(req.body).then((data) => {
        res.redirect('/checkout')
    })
}

const add_address_profile = (req, res) => {
    userHelpers.addAddress(req.body).then((data) => {
        res.redirect('/my-account')
    })
}


const orders = async (req, res) => {
    let orderList = await userHelpers.getUserOrders(req.session.user._id)
    console.log(orderList);
    res.render('user/orders', { userExist: true, user: req.session.user, orderList })
}

const viewOrder_products = async (req, res) => {
    userHelpers.getOrderProducts(req.params.id).then((data) => {
        let products = data.orderItems
        let totals = data.totals
        let address = data.address
        res.render('user/view-order-products', { proDetails: true, user: req.session.user, products, totals, address })
    })
}

const cancel_Order = (req, res) => {
    orderHelpers.cancelOrder(req.params.id).then(() => {
        res.redirect('/orders')
    })
}

const re_Order = (req, res) => {
    orderHelpers.reOrder(req.params.id).then(() => {
        res.redirect('/orders')
    })
}

const item_Return = (req, res) => {
    orderHelpers.itemReturn(req.params.id).then(() => {
        res.redirect('/orders')
    })
}

const verify_Payment = (req, res) => {
    console.log(req.body);
    userHelpers.verifyPayment(req.body).then(() => {
        userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
            res.json({ status: true })
            console.log('Payment Successful');
        })
    }).catch((err) => {
        res.json({ status: false })
    })
}


const paypalPay = (req, res) => {
    try {
        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://localhost:7137/order-success/" + req.params.id,
                "cancel_url": "http://localhost:7137/cancel"
            },
            "transactions": [{
                "amount": {
                    "currency": "USD",
                    "total": '25.00'
                },
            }]
        }


        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.log(error);
                throw error;
            } else {
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        console.log("**************orderID*****************")
                        console.log(req.params.id);
                        console.log("*******************************")
                        res.redirect(payment.links[i].href);
                    }
                }
            }
        });

    } catch (error) {
        console.log(error)
    }

}

const orderSuccess = (req, res) => {
    try {
        console.log('order success');
        userHelpers.changePaymentStatus(req.params.id).then(() => {
            res.render('user/order-success', { proDetails: true, user: req.session.user });
        })
    } catch (error) {
        console.log(error)
    }

}

const myAccount = async (req, res) => {
    let address = await userHelpers.getAllAddresses(req.session.user._id)
    res.render('user/my-account', { userExist: true, user: req.session.user, address, passwordChangeSuccess })
    passwordChangeSuccess = false
}

const edit_Profile = async (req, res) => {
    let userEditDetails = await userHelpers.getUserDetails(req.params.id)
    console.log(userEditDetails);
    res.render('user/edit-profile', { proDetails: true, userEditDetails, user: req.session.user })
}

const postProfileEdit = (req, res) => {
    let userId = req.params.id
    let updatedDetails = req.body
    userHelpers.updateUserDetails(userId, updatedDetails).then(() => {
        res.redirect('/logout')
    })

}

const change_Password = (req, res) => {
    try {
        userHelpers.changePassword(req.body).then(() => {
            passwordChangeSuccess = true
            res.redirect('/my-account')
        })
    } catch (error) {
        console.log(error);
    }
}




const password_Check = (req, res) => {
    console.log('api call');
    userHelpers.passwordCheck(req.body).then(() => {
        console.log('true');
        res.json({ check: true })
    })
        .catch(() => {
            console.log('false');
            res.json({ check: false })
        })
}

const wallet_Balance = (req, res) => {
    try {
        userHelpers.getWalletBalance(req.params.id).then((data) => {
            res.json(data)
        })
    } catch (error) {
        console.log(error);
    }
}

const postCouponSubmit = (req, res) => {
    let user = req.session.user
    productHelpers.findCoupon(req.body.coupon, user).then(async (response) => {
        if (response.a) {
            let totalPrice = await userHelpers.getTotalAmount(user._id)
            let discount = totalPrice[0].total * parseInt(response.a.discount) / 100
            let amount = totalPrice[0].total - discount
            response.couponname = response.a.coupon
            response.discountedprice = totalPrice[0].total - amount
            response.finalAmount = amount
            res.json(response)
        } else {
            res.json(response)
        }
    })
}

const remove_Coupon = (req, res) => {
    let coupon = req.params.id
    let userId = req.session.user._id
    userHelpers.removeCoupon(userId, coupon)
    res.redirect('/checkout')
}





module.exports = {
    userHome,
    userLogin,
    userLoggedin,
    userSignup,
    userSignedup,
    userLogout,
    shop,
    cart,
    otpLogin,
    sendCode,
    verifyOtp,
    verifiedOtp,
    productDetails,
    addTo_Cart,
    changeProduct_Quantity,
    checkoutPage,
    place_order,
    add_address,
    orders,
    viewOrder_products,
    getProductsBy_Category,
    getProductsBy_SubCategory,
    getSub_Categories,
    cancel_Order,
    re_Order,
    item_Return,
    addTo_Wishlist,
    removeFrom_Wishlist,
    wishlist,
    verify_Payment,
    paypalPay,
    orderSuccess,
    myAccount,
    edit_Profile,
    postProfileEdit,
    add_address_profile,
    change_Password,
    password_Check,
    wallet_Balance,
    postCouponSubmit,
    remove_Coupon
} 