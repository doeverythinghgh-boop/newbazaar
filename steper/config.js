/**
 * @file config.js
 * @description ملف الإعدادات والثوابت للمشروع.
 * يحتوي هذا الملف على القيم الثابتة التي تستخدم في جميع أنحاء التطبيق، مثل معرفات المسؤولين (Admins).
 * الغرض منه هو تجميع الإعدادات في مكان واحد لسهولة التعديل والإدارة.
 */

/**
 * @constant {string[]} ADMIN_IDS
 * @description قائمة معرفات المستخدمين الذين يمتلكون صلاحيات المسؤول (Admin).
 * يتم استخدام هذه القائمة للتحقق مما إذا كان المستخدم الحالي مسؤولاً أم لا.
 * @example
 * // للتحقق مما إذا كان المستخدم admin:
 * if (ADMIN_IDS.includes(userId)) { ... }
 */
export var ADMIN_IDS = ["xx1", "xx2"];

/**
 * @constant {object} appDataControl
 * @description كائن التحكم المركزي الذي يحل محل control.json.
 * يحتوي على بيانات المستخدم الحالي، تعريف المستخدمين، والخطوات.
 */
export var appDataControl = {
    currentUser: {

        "idUser": "seller_key_1"


    },

    users: [
        {
            type: "buyer",
            allowedSteps: ["step-review", "step-delivered", "step-cancelled", "step-rejected", "step-returned"]
        },
        {
            type: "seller",
            allowedSteps: ["step-review", "step-confirmed", "step-shipped", "step-cancelled", "step-rejected", "step-returned"]
        },
        {
            type: "courier",
            allowedSteps: ["step-review", "step-shipped", "step-delivered", "step-cancelled", "step-rejected", "step-returned"]
        },
        {
            type: "admin",
            allowedSteps: [
                "step-review",
                "step-confirmed",
                "step-shipped",
                "step-delivered",
                "step-cancelled",
                "step-rejected",
                "step-returned"
            ]
        }
    ],

    steps: [
        {
            id: "step-review",
            no: "1",
            description: "الطلب تم إرساله وينتظر تأكيد البائع "
        },
        {
            id: "step-confirmed",
            no: "2",
            description: "البائع وافق على الطلب وسيبدأ في التجهيز والشحن "
        },
        {
            id: "step-shipped",
            no: "3",
            description: "المنتج تم تسليمه لشركة الشحن "
        },
        {
            id: "step-delivered",
            no: "4",
            description: "المشتري استلم المنتج "
        },
        {
            id: "step-cancelled",
            no: "5",
            description: "بعض الطلبات أُلغيت من قبل المشتري "
        },
        {
            id: "step-rejected",
            no: "6",
            description: "البائع او الاداره رفضت تنفيذ الطلبات لنفاد الكمية أو مشكلة في المنتج"
        },
        {
            id: "step-returned",
            no: "7",
            description: "المشتري أعاد بعض المنتجات بعد استلامه وتم قبول الإرجاع "
        }
    ]
};

/**
 * @constant {Array<object>} ordersData
 * @description بيانات الطلبات التي تحل محل orders_.json.
 */
export var ordersData = [
    {
        order_key: "order_key_1",
        user_key: "user_key_1",
        user_name: "user name 1",
        user_phone: "01026666666",
        user_address: "user address 1",
        order_status: "",
        created_at: "2025-11-25 18:24:00",
        order_items: [
            {
                product_key: "product_key_1",
                product_name: "Product 1",
                quantity: 1,
                seller_key: "seller_key_1",
                supplier_delivery: {
                    delivery_key: "delivery_key_1",
                    delivery_name: "delivery name 1",
                    delivery_phone: "01026666666"
                }
            },
            {
                product_key: "product_key_2",
                product_name: "Product 2",
                quantity: 1,
                seller_key: "seller_key_1",
                supplier_delivery: {
                    delivery_key: [
                        "delivery_key_2",
                        "delivery_key_3"
                    ],
                    delivery_name: ["delivery name 1", "delivery name 2"],
                    delivery_phone: ["01026666666", "01026666666"],
                }
            },
            {
                product_key: "product_key_3",
                product_name: "Product 3",
                quantity: 1,
                seller_key: "seller_key_1",
                supplier_delivery: {
                    delivery_key: "delivery_key_2",
                    delivery_name: "delivery name 2",
                    delivery_phone: "01026666666"
                }
            }
        ]
    }
];

/**
 * @var {object|null} globalStepperAppData
 * @description متغير عام يحمل نسخة من بيانات التطبيق (stepper_app_data).
 * يتم تحديثه تلقائياً عند تغيير الحالة.
 */
export var globalStepperAppData = null;

/**
 * @function updateGlobalStepperAppData
 * @description دالة لتحديث المتغير العام globalStepperAppData وطباعة القيمة الجديدة.
 * @param {object} newData - البيانات الجديدة.
 */
export function updateGlobalStepperAppData(newData) {
    globalStepperAppData = newData;
    console.log("Global stepper_app_data updated:", globalStepperAppData);
}

/**
 * @description تهيئة البيانات من window.parent.globalStepperAppData إذا كانت متوفرة
 * يتم تحديث idUser و ordersData بالقيم الحقيقية
 */
(function initializeFromParent() {
    try {
        // التحقق من وجود بيانات من النافذة الأم
        if (window.parent && window.parent.globalStepperAppData) {
            const parentData = window.parent.globalStepperAppData;

            console.log('تم العثور على بيانات من النافذة الأم:', parentData);

            // تحديث idUser
            if (parentData.idUser) {
                appDataControl.currentUser.idUser = parentData.idUser;
                console.log('تم تحديث idUser إلى:', parentData.idUser);
            }

            // تحديث ordersData
            if (parentData.ordersData && Array.isArray(parentData.ordersData)) {
                ordersData.length = 0; // مسح البيانات الافتراضية
                ordersData.push(...parentData.ordersData); // إضافة البيانات الحقيقية
                console.log('تم تحديث ordersData:', ordersData);
            }

            console.log('تمت التهيئة بنجاح من البيانات الحقيقية');
        } else {
            console.log('لا توجد بيانات من النافذة الأم، استخدام القيم الافتراضية');
        }
    } catch (error) {
        console.error('خطأ في تهيئة البيانات من النافذة الأم:', error);
        console.log('سيتم استخدام القيم الافتراضية');
    }
})();

