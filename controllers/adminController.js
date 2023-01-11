const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require('../helpers/admin-helpers')
const categoryHelpers = require('../helpers/category-helpers');
const orderHelpers = require("../helpers/order-helpers");
const chartHelpers = require('../helpers/chart-helpers');
const userHelpers = require("../helpers/user-helpers");
const credentials = {
    email: 'admin@gmail.com',
    password: 'admin123'
}
let adminLoggedOut



const home = async (req, res, next) => {
    if (req.session.loggedIn) {
        let codTotalSale = await chartHelpers.totalSaleCod()
        let razorPayTotalSale = await chartHelpers.totalSaleRazorPay()
        let paypalTotalSale = await chartHelpers.totalSalePaypal()
        let totalRevenue = razorPayTotalSale[0].razortotal + codTotalSale[0].codTotal + paypalTotalSale[0].paypalTotal
        let getTotalSalesGraph = await chartHelpers.getTotalSalesGraph()
        let totalCustomers = await chartHelpers.findTotalCustomers()
        res.render('admin/admin-home', { admin: true, dashboard: true,totalCustomers, getTotalSalesGraph, codTotalSale, razorPayTotalSale, paypalTotalSale, totalRevenue })
    } else {
        res.redirect('admin/login')
    }
}

const loginPage = (req, res) => {
    if (req.session.loggedIn) {
        console.log('-------------------session exist');
        res.redirect('/admin')
    }
    else if (req.session.adminLoginErr) {
        console.log('-----------------------login error');
        res.render('admin/login', { adminLogin: true, adminLoginErr: req.session.adminLoginErr })
        req.session.adminLoginErr = false
    } else if (adminLoggedOut) {
        res.render('admin/login', { adminLogin: true, adminLoggedOut })
        adminLoggedOut = false
    }
    else {
        console.log('-----------------no login error but not logged in');
        res.render('admin/login', { adminLogin: true })
    }
}


const loggedIn = (req, res) => {
    if (req.body.email == credentials.email && req.body.password == credentials.password) {
        req.session.admin = req.body
        req.session.loggedIn = true
        res.redirect('/admin')
    } else {
        req.session.adminLoginErr = true
        res.redirect('/admin')
    }
}


const products = (req, res) => {
    productHelpers.getAllProducts(req.query.page, req.query.limit).then((data) => {
        let products = data.products
        let pageNum = data.pageNum
        let page = req.query.page - 1
        let limit = req.query.limit
        if (limit == products.length) {
            for (let i = 0; i < limit; i++) {
                products[i].index = (limit * page) + (i + 1)
            }
        } else {
            for (let i = 0; i < products.length; i++) {
                products[i].index = (limit * page) + (i + 1)
            }
        }
        console.log(page);
        console.log(limit);
        console.log(products);
        res.render('admin/products', { admindatatable: true, products, pageNum, product: true })
    })
}

const addProduct = async (req, res) => {
    let categories = await categoryHelpers.getAllCategories()
    res.render('admin/add-product', { admin: true, categories })
}

const addedProduct = (req, res) => {
    const files = req.files
    const file = files.map((file) => {
        return file
    })
    const fileName = file.map((file) => {
        return file.filename
    })
    const product = req.body
    product.img = fileName
    console.log('////////');
    console.log(req.body);
    console.log(product.img);
    console.log('///////////');

    productHelpers.addProduct(product, (result) => {
        res.redirect('/admin/products/?page=1&limit=6')
    })
}

const delete_product = (req, res) => {
    let prodId = req.params.id
    console.log(prodId);
    productHelpers.deleteProduct(prodId).then((response) => {
        res.json({ deletedStatus: true })
    })
}

const edit_product = async (req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id)
    console.log(product);
    res.render('admin/edit-product', { admin: true, product })
}

const edited_product = (req, res) => {
    const files = req.files
    const file = files.map((file) => {
        return file
    })
    const fileName = file.map((file) => {
        return file.filename
    })
    const product = req.body
    product.img = fileName
    console.log(product);
    productHelpers.updateProduct(req.params.id, req.body).then(() => {
        res.redirect('/admin/products/?page=1&limit=6')
    })
}


const add_Stock = (req, res) => {
    productHelpers.addStock(req.body).then(() => {
        res.redirect('/admin/products/?page=1&limit=6')
    })
}

const update_Discount = (req, res) => {
    productHelpers.updateDiscount(req.body).then(() => {
        res.redirect('/admin/products/?page=1&limit=6')
    })
}

const update_DiscountSubCat = (req, res) => {
    console.log('api call');

    categoryHelpers.updateDiscountSubCat(req.body).then(() => {
        res.redirect('/admin/categories')
    })
}



//===================================================================================================CATEGORY AND SUB-CATEGORY=========//
const categories = async (req, res) => {
    let categories = await categoryHelpers.getAllCategories()
    res.render('admin/categories', { admin: true, categories, category: true })
}

const addCategories = async (req, res) => {
    let categories = await categoryHelpers.getAllCategories()
    console.log(categories);
    res.render('admin/add-category', { admin: true, categories })
}

const addedCategory = (req, res) => {
    console.log(req.body);
    categoryHelpers.addCategory(req.body).then(() => {
        res.redirect('/admin/add-category')
    })
}

const addSub_Category = (req, res) => {
    categoryHelpers.addSubCategory(req.body).then(() => {
        res.redirect('/admin/add-category')
    })
}

const getSub_Categories = (req, res) => {
    categoryHelpers.getSubCategories(req.params.id).then((subs) => {
        console.log(subs);
        res.json(subs)
    })
}

const deleteSub_Category = (req, res) => {
    // console.log(req.body);
    categoryHelpers.deleteSubCategory(req.body).then((response) => {
        res.json({ deletedStatus: true })
    })
}

const editSubCategory = (req, res) => {
    console.log('/////////////////');
    console.log(req.body);
    categoryHelpers.updateSubCategory(req.body).then(() => {
        res.redirect('/admin/categories')
    })
}


//====================================================================================================CATEGORY AND SUB-CATEGORY END=====//

const users = async (req, res) => {
    let users = await adminHelpers.getAllUsers()
    res.render('admin/users', { users, admin: true, user: true })
}

const blockUser = (req, res) => {
    let userId = req.params.id
    console.log(userId);
    adminHelpers.blockUSer(userId).then((response) => {
        res.redirect('/admin/users')
    })
}

const unblockUser = (req, res) => {
    let userId = req.params.id
    console.log(userId);
    adminHelpers.unblockUSer(userId).then((response) => {
        res.redirect('/admin/users')
    })
}

const adminLogout = (req, res) => {
    req.session.loggedIn = false
    console.log('----------------------loggedout');
    adminLoggedOut = true
    res.redirect('/admin')
}

const viewProduct = async (req, res) => {
    console.log(req.params.id);
    let product = await productHelpers.getProductDetails(req.params.id)
    console.log('++++++++++++++++++++++++++++' + product)
    console.log(products.img)
    res.json(product)
}

//================================ORDER MANAGEMENT=============================================//

const manage_orders = async (req, res) => {
    let orders = await adminHelpers.getAllOrders()
    console.log(orders);   
    res.render('admin/manage-orders', { orders, admindatatable: true, order: true })
}

const item_Delivered = (req, res) => {
    orderHelpers.itemDelivered(req.params.id).then(() => {
        res.redirect('/admin/manage-orders')
    })
}

const item_Shipped = (req, res) => {
    orderHelpers.itemShipped(req.params.id).then(() => {
        res.redirect('/admin/manage-orders')
    })
}

const item_OutForDelivery = (req, res) => {
    orderHelpers.itemOutForDelivery(req.params.id).then(() => {
        res.redirect('/admin/manage-orders')
    })
}

const order_ApproveReturn = (req, res) => {
    orderHelpers.orderApproveReturn(req.params.id,req.session.user._id).then(() => {
        res.redirect('/admin/manage-orders')
    })
}

const duplicate_category = (req, res) => {
    try {
        console.log('api call');
        console.log('===========================================' + req.body.catName);
        categoryHelpers.checkDuplicateCategory(req.body.catName).then(() => {
            res.json({ duplicate: true })
        }).catch(() => {
            res.json({ notDuplicate: true })
        })
    } catch (error) {
        console.log(error);
    }
}

const duplicate_subcategory = (req, res) => {
    try {
        console.log('api call');
        console.log('===========================================' + req.body.subCatName);
        categoryHelpers.checkDuplicateSubCategory(req.body.subCatName, req.body.catId).then(() => {
            res.json({ duplicate: true })
        }).catch(() => {
            res.json({ notDuplicate: true })
        })
    } catch (error) {
        console.log(error);
    }
}

const orderDetails = (req, res) => {
    adminHelpers.getOrderDetails(req.params.id).then((data) => {
        let products = data.orderItems
        let totals = data.totals
        let address = data.address
        res.render('admin/order-details', { admin: true, products, totals, address })
    })
}

const couponPage = (req, res) => {
    productHelpers.getAllCoupons().then((coupons) => {
        res.render('admin/couponManagement', { coupons, admin: true, coupon: true })
    })
}

const add_Coupon = (req, res) => {
    productHelpers.addCoupon(req.body).then(() => {
        res.redirect('/admin/couponManagement')
    })
}

const delete_Coupon = (req, res) => {
    productHelpers.deleteCoupon(req.params.id)
    res.redirect('/admin/couponManagement')
}

const sales_Report = async (req, res) => {
  let DailySalesReport = await chartHelpers.getDailySalesReport()
  let MonthlySalesReport = await chartHelpers.getMonthlySales()
  let YearlySalesReport = await chartHelpers.getYearlySalesReport()
  let getDailySalesTotal = await chartHelpers.getDailySalesTotal()
  let getMonthlySalesTotal = await chartHelpers.getMonthlySalesTotal()
  let getYearlySalesTotal = await chartHelpers.getYearlySalesTotal()
  res.render('admin/sales-report', { DailySalesReport, MonthlySalesReport, YearlySalesReport, getDailySalesTotal,getMonthlySalesTotal,getYearlySalesTotal, admin:true })
}





module.exports = {
    home,
    loginPage,
    loggedIn,
    products,
    addProduct,
    addedProduct,
    delete_product,
    edit_product,
    edited_product,
    categories,
    addCategories,
    users,
    blockUser,
    unblockUser,
    adminLogout,
    viewProduct,
    addedCategory,
    addSub_Category,
    getSub_Categories,
    deleteSub_Category,
    editSubCategory,
    add_Stock,
    update_Discount,
    manage_orders,
    item_Delivered,
    item_Shipped,
    item_OutForDelivery,
    order_ApproveReturn,
    duplicate_category,
    duplicate_subcategory,
    orderDetails,
    update_DiscountSubCat,
    couponPage,
    add_Coupon,
    delete_Coupon,
    sales_Report
}