//{"id":6,"username":"هشام جابر 2","phone":"01026546550","Password":"1111","Address":null,"user_key":"682dri6b","is_seller":3}
let userSession = null; //بيانات المستخدم
let productSession = null; //بيانات منتج للعرض
let mainCategorySelectToAdd = null; //الفئه الرئيسية المختارة عند اضافة منتج
let subCategorySelectToAdd = null; //الفئه الفرعية المختارة عند اضافة منتج
let productTypeToAdd = null; //نوع المنتج المختار المختارة عند اضافة منتج
let myProducts = null; //نوع المنتج المختار عند اضافة منتج

function productViewLayout(View) {
  //productSession = [productDataForModal,option];
  if (View == 0) {
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
  if (View == 2) {
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
