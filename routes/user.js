var express = require('express');
const { item_Delivered } = require('../controllers/adminController');
const { userHome, userLogin, userSignup, userSignedup, userLoggedin, userLogout, cart, otpLogin, sendCode, verifyOtp, verifiedOtp, productDetails, addTo_Cart, changeProduct_Quantity, checkoutPage, place_order, add_address, orders, viewOrder_products, getProductsBy_Category, getProductsBy_SubCategory, getSub_Categories, shop, cancel_Order, re_Order, addTo_Wishlist, removeFrom_Wishlist, wishlist, verify_Payment, paypalPay, orderSuccess, myAccount, edit_Profile, postProfileEdit, add_address_profile, change_Password, password_Check, item_Return, email_Validate, wallet_Balance, postCouponSubmit, remove_Coupon, wallet_History, delete_CartProducts } = require('../controllers/userController');
const { verifyLogin } = require('../middlewares/user-middlewares');
var router = express.Router();

/* GET home page. */
router.get('/', userHome);

router.get('/login', userLogin)

router.post('/login', userLoggedin)

router.get('/signup', userSignup)

router.post('/signup', userSignedup)

router.get('/logout', userLogout)

router.get('/shop', shop)

router.get('/get-sub-categories/:id', getSub_Categories)

router.get('/shopbycategory', getProductsBy_Category)

router.get('/shopbysubcategory', getProductsBy_SubCategory)

router.get('/otp-login', otpLogin)

router.post('/send-code', sendCode)

router.get('/verify-otp', verifyOtp)

router.post('/verify-otp', verifiedOtp)

router.get('/product-details/:id', productDetails)

router.get('/cart', verifyLogin, cart)

router.get('/wishlist', verifyLogin, wishlist)

router.get('/add-to-cart/:id', verifyLogin, addTo_Cart)

router.post('/delete-cart-products',delete_CartProducts)

router.get('/add-to-wishlist/:id', verifyLogin, addTo_Wishlist)

router.get('/remove-from-wishlist/:id', verifyLogin, removeFrom_Wishlist)

router.post('/change-product-quantity', changeProduct_Quantity)

router.get('/checkout', verifyLogin, checkoutPage)

router.post('/place-order', place_order)

router.post('/add-address', add_address)

router.post('/add-address-profile', add_address_profile)

router.get('/orders', verifyLogin, orders)

router.get('/view-order-products/:id', verifyLogin, viewOrder_products)

router.get('/cancel-order/:id', cancel_Order)

router.get('/reorder/:id', re_Order)

router.get('/return/:id', item_Return)

router.post('/verify-payment', verify_Payment)

router.get('/paypal-pay/:id', paypalPay)

router.get('/order-success/:id', verifyLogin, orderSuccess)

router.get('/my-account', verifyLogin, myAccount)

router.get('/edit-profile/:id', verifyLogin, edit_Profile)

router.post('/submit-profile-edit/:id', verifyLogin, postProfileEdit)

router.post('/change-password', verifyLogin, change_Password)

router.post('/password-check', password_Check)

router.get('/get-wallet-balance/:id', wallet_Balance)

router.post('/couponSubmit', verifyLogin, postCouponSubmit)

router.get('/remove-coupon/:id', verifyLogin, remove_Coupon)

router.get('/get-wallet-history/:id',wallet_History)





module.exports = router;


