//{"id":6,"username":"هشام جابر 2","phone":"01026546550","Password":"1111","Address":null,"user_key":"682dri6b","is_seller":3}
window.userSession = null; //بيانات المستخدم
window.productSession = null; //بيانات منتج للعرض
window.mainCategorySelectToAdd = null; //الفئه الرئيسية المختارة عند اضافة منتج
window.subCategorySelectToAdd = null; //الفئه الفرعية المختارة عند اضافة منتج
window.productTypeToAdd = null; //نوع المنتج المختار المختارة عند اضافة منتج
window.myProducts = null; //نوع المنتج المختار عند اضافة منتج

function productViewLayout(View) {
  console.log('------------------------نوع الخدمه-------------------', View);
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

function productAddLayout(editMode = false) {
  if (mainCategorySelectToAdd == 6) {
    productTypeToAdd = 2; //نوع المنتج خدمي
  } else {
    productTypeToAdd = 0; //نوع المنتج افتراضي
  }
  if (editMode==false) {
    mainLoader(
      "./pages/productAdd.html",
      "index-product-container",
      0,
      undefined,
      "showHomeIcon",
      true
    );
  }

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

/**
 * @description يعرض نافذة منبثقة لاختيار الفئة الرئيسية والفرعية قبل إضافة منتج جديد.
 * @async
 * @function showAddProductModal
 * @returns {Promise<void>}
 */
async function showAddProductModal() {
  try {

    const result = await CategoryModal.show();
    if (result.status === 'success') {
      console.log('تم الاختيار:', result.mainId, result.subId);
      mainCategorySelectToAdd = result.mainId; //الفئه الرئيسية المختارة عند اضافة منتج
      subCategorySelectToAdd = result.subId; //الفئه الفرعية المختارة عند اضافة منتج
      productAddLayout();
    }


  } catch (error) {
    console.error("خطأ في عرض نافذة إضافة المنتج:", error);
    Swal.fire("خطأ", "حدث خطأ أثناء محاولة عرض النافذة.", "error");
  }
}
