//{"id":6,"username":"هشام جابر 2","phone":"01026546550","Password":"1111","Address":null,"user_key":"682dri6b","is_seller":3}
window.userSession = null; //بيانات المستخدم
window.productSession = null; //بيانات منتج للعرض
window.mainCategorySelectToAdd = null; //الفئه الرئيسية المختارة عند اضافة منتج
window.subCategorySelectToAdd = null; //الفئه الفرعية المختارة عند اضافة منتج
window.productTypeToAdd = null; //نوع المنتج المختار المختارة عند اضافة منتج
window.myProducts = null; //نوع المنتج المختار عند اضافة منتج

function productViewLayout(View) {
  //في الارسال
  //productSession = [productDataForModal,{showAddToCart:true}];
  //في الاستقبال
  //(productSession[0],  productSession[1] )
  //function productView_viewDetails(productData, options = {})--->options.showAddToCart
  if (View == '0') {
    //option = t/f ==> view or hidden pasket option
    mainLoader(
      "pages/productView.html",
      "index-product-container",
      0,
      undefined,
      "showHomeIcon",
      true
    );
  }
  if (View == '2') {
    mainLoader(
      "pages/productView2.html",
      "index-product-container",
      0,
      undefined,
      "showHomeIcon",
      true
    );
  }
}

function productAddLayout() {
  if (mainCategorySelectToAdd == 6) {
    productTypeToAdd = 2; //نوع المنتج خدمي
  } else {
    productTypeToAdd = 0; //نوع المنتج افتراضي
  }
  mainLoader(
    "./pages/productAdd.html",
    "index-product-container",
    0,
    undefined,
    "showHomeIcon",
    true
  );
}

function productEditLayout() {
  if (mainCategorySelectToAdd == 6) {
    productTypeToAdd = 2; //نوع المنتج خدمي
  } else {
    //نوع المنتج افتراضي
    mainLoader(
      "./pages/productEdit.html",
      "index-product-container",
      0,
      undefined,
      "showHomeIcon",
      true
    );
  }
}
