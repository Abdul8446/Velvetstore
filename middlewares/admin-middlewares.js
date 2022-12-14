const adminVerifyLogin=(req,res,next)=>{
    console.log('-----------------------in');
    if(req.session.loggedIn){
        console.log('hsahghjasfvhasjkfjkaskj');
        return next()
    }else{
        res.redirect('/admin/login')
        console.log('--------------------------------redirect');
    }
}






module.exports={
    adminVerifyLogin
}
