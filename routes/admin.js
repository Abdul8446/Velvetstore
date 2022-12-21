var express = require('express');
const { home, products, addProduct, addedProduct, delete_product, edit_product, edited_product, loggedIn, categories, addCategories, users, blockUser, unblockUser, loginPage, adminLogout, viewProduct, addedCategory, addSub_Category, getSub_Categories, deleteSub_Category, editSubCategory, add_Stock, update_Discount, manage_orders, item_Delivered, duplicate_category, duplicate_subcategory, orderDetails, item_Shipped, item_OutForDelivery, order_ApproveReturn, update_DiscountSubCat, couponPage, add_Coupon, delete_Coupon, sales_Report } = require('../controllers/adminController');
const { adminVerifyLogin } = require('../middlewares/admin-middlewares');
const { upload } = require('../server/multer');
var router = express.Router();


/* GET users listing. */
router.get('/', home)

router.get('/login',loginPage)

router.post('/login', loggedIn)

router.get('/products',adminVerifyLogin, products)

router.get('/add-product',adminVerifyLogin, addProduct)

router.post('/add-product', upload.array('image'), addedProduct)

router.get('/delete-product/:id',adminVerifyLogin, delete_product)

router.get('/edit-product/:id',adminVerifyLogin, edit_product)

router.post('/edit-product/:id', upload.array('image'), edited_product)

router.get('/view-product/:id',viewProduct)

router.get('/categories',adminVerifyLogin, categories)

router.get('/add-category', adminVerifyLogin,addCategories)

router.post('/add-category',addedCategory)         

router.post('/add-sub-category',addSub_Category)      

router.get('/users',adminVerifyLogin, users)

router.get('/block-user/:id', blockUser)

router.get('/unblock-user/:id', unblockUser)

router.get('/admin-logout',adminLogout)

router.get('/get-sub-categories/:id',getSub_Categories)

router.post('/delete-sub-category',deleteSub_Category)

router.post('/edit-sub-category',editSubCategory)

router.post('/add-stock',add_Stock)

router.post('/update-discount',update_Discount)

router.post('/update-discount-sub-category',update_DiscountSubCat)

router.get('/manage-orders',adminVerifyLogin,manage_orders)

router.get('/order-details/:id',orderDetails)

router.get('/order-delivered/:id',item_Delivered)

router.get('/order-shipped/:id',item_Shipped)

router.get('/order-out-for-delivery/:id',item_OutForDelivery)

router.get('/order-out-for-delivery/:id',item_Delivered)

router.get('/order-approve-return/:id',order_ApproveReturn)

router.post('/check-duplicate-category',duplicate_category)

router.post('/check-duplicate-sub-category',duplicate_subcategory)

router.get('/couponManagement',adminVerifyLogin,couponPage)

router.post('/addcoupon',add_Coupon)

router.get('/delete-coupon/:id', adminVerifyLogin, delete_Coupon)

router.get('/sales-report',adminVerifyLogin,sales_Report)


router.get('/test',(req,res)=>{
    const CC = require('currency-converter-lt')
    let fromCurrency='USD'
    let toCurrency='INR'
    let amount=1
    let converter=new CC({
        from:"USD",
        to:'INR',
        amount:amount
    })
    converter.convert().then((response)=>{
        console.log(amount+' '+response);
        res.render('admin/test',{admin:true})
    })
})

 
   

module.exports = router;
