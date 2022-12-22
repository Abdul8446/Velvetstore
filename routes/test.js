var express = require('express');
const { home, products, addProduct, addedProduct, delete_product, edit_product, edited_product, loggedIn, categories, addCategories, users, blockUser, unblockUser, loginPage, adminLogout, viewProduct, addedCategory, addSub_Category, getSub_Categories, deleteSub_Category, editSubCategory, add_Stock, update_Discount } = require('../controllers/adminController');
const { adminVerifyLogin } = require('../middlewares/admin-middlewares');
const { upload } = require('../server/multer');
var router = express.Router();



const userss = [
    { id: 1, name: 'user1' },
    { id: 2, name: 'user2' },
    { id: 3, name: 'user3' },
    { id: 4, name: 'user4' },
    { id: 5, name: 'user5' },
    { id: 6, name: 'user6' },
    { id: 7, name: 'user7' },
    { id: 8, name: 'user8' },
    { id: 9, name: 'user9' },
    { id: 10, name: 'user10' },
    { id: 11, name: 'user11' },
    { id: 12, name: 'user12' },
    { id: 13, name: 'user13' },
    { id: 14, name: 'user14' },
    { id: 15, name: 'user15' },

]



router.get('/users', (req, res) => {
    res.json(userss)
})


module.exports = router;

function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            alert('in success')
            if (response.status) {
                alert('success')
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'Order Placed Successfully',
                    showConfirmButton: true,
                    confirmButtonText: 'Continue Shopping'
                }).then((result) => {
                    if (result.value) {
                        window.location.href = `/shop/?page=1&limit=6`
                    }
                });

            } else {
                alert('order not placed')
            }
        }
    })
}
function speed() {
    document.getElementById('jhdshk').activeElement
}



function addProductValidate(){
        let name = document.forms["addproductForm"]["name"].value
        let description = document.forms['addproductForm']['description'].value
        let subcategory = document.forms['addproductForm']['subcategory'].value
        let MRP = document.forms['addproductForm']['MRP'].value
        let stock = document.forms['addproductForm']['stock'].value
        let image = document.forms['addproductForm']['image'].value
        if(name==""||name.trim()==""){
            document.getElementById('namevalidate').innerHTML='Name must be filled out'
            return false
        }else if(description==""||description.trim()==""){
            document.getElementById('descriptionvalidate').innerHTML='Name must be filled out'
            return false
        }
    }


   


     