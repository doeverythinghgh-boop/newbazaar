/**
 * @file popupHelpers.js
 * @description دوال مساعدة للنوافذ المنبثقة (Popup Helpers).
 * يحتوي هذا الملف على منطق مشترك يستخدم في النوافذ المنبثقة المختلفة،
 * وأهمها منطق تفعيل المراحل والتحقق من التسلسل الصحيح للخطوات.
 */

import {
    saveStepState,
    loadStepState,
} from "./stateManagement.js";
import {
    updateCurrentStepFromState,
} from "./uiUpdates.js";

/**
 * @function addStatusToggleListener
 * @description تضيف مستمع حدث (Event Listener) لمربع اختيار "تفعيل المرحلة" في النوافذ المنبثقة.
 * هذه الدالة تحتوي على المنطق الجوهري للتحكم في تدفق المراحل (Workflow Control).
 * 
 * تقوم بما يلي:
 * 1. الاستماع لتغيير حالة الـ checkbox.
 * 2. التحقق من أن الانتقال للمرحلة الجديدة مسموح به (يجب أن يكون بالتسلسل).
 * 3. عرض رسائل تحذير إذا حاول المستخدم تخطي مراحل.
 * 4. طلب تأكيد نهائي من المستخدم قبل التفعيل.
 * 5. حفظ الحالة الجديدة وتحديث الواجهة عند التأكيد.
 * 
 * @param {object} controlData - بيانات التحكم التي تحتوي على تعريف الخطوات.
 */
export function addStatusToggleListener(controlData, ordersData) {
    try {
        const checkbox = document.getElementById("modal-step-status-checkbox");
        if (!checkbox) return;

        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                const checkboxElement = e.target;
                const stepIdToActivate = checkboxElement.dataset.stepId;

                // الحصول على كائن المرحلة الحالية من البيانات
                const currentStep = controlData.steps.find(
                    (s) => s.id === stepIdToActivate
                );

                if (!currentStep) {
                    checkboxElement.checked = false;
                    return;
                }

                // تعريف المراحل الأساسية التي يجب أن تسير بترتيب صارم
                const basicSteps = ["step-review", "step-confirmed", "step-shipped", "step-delivered"];
                // المراحل النهائية/الفرعية (لا تخضع لنفس قواعد الترتيب الصارم بالضرورة، لكن هنا للذكر)
                const finalSteps = ["step-cancelled", "step-rejected", "step-returned"];

                // التحقق من منطق التسلسل للمراحل الأساسية
                if (basicSteps.includes(stepIdToActivate)) {
                    // الحصول على رقم المرحلة النشطة حالياً من التخزين
                    const savedCurrentStep = loadStepState("current_step");
                    let currentActiveStepNo = 0;

                    if (savedCurrentStep) {
                        currentActiveStepNo = parseInt(savedCurrentStep.stepNo) || 0;
                    }

                    const requestedStepNo = parseInt(currentStep.no);

                    // القاعدة: يجب أن تكون المرحلة المطلوبة هي (المرحلة الحالية + 1)
                    if (requestedStepNo !== currentActiveStepNo + 1) {
                        let errorMessage = "";

                        if (requestedStepNo <= currentActiveStepNo) {
                            errorMessage = "لا يمكن الرجوع إلى مرحلة سابقة. يجب التقدم بالترتيب فقط.";
                        } else {
                            errorMessage = `يجب تفعيل المراحل بالترتيب. المرحلة التالية المتاحة هي رقم ${currentActiveStepNo + 1}.`;
                        }

                        // عرض رسالة خطأ ومنع التفعيل
                        Swal.fire({
                            title: "تنبيه",
                            text: errorMessage,
                            icon: "warning",
                            confirmButtonText: "حسنًا",
                            customClass: { popup: "fullscreen-swal" },
                        });

                        checkboxElement.checked = false; // إلغاء التحديد
                        return;
                    }
                }

                // إذا اجتاز التحقق، اطلب تأكيد المستخدم النهائي
                Swal.fire({
                    title: "تأكيد تفعيل المرحلة",
                    text: "بمجرد تفعيل هذه المرحلة، لا يمكنك التراجع. هل أنت متأكد؟",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "نعم، قم بالتفعيل",
                    cancelButtonText: "إلغاء",
                    customClass: { popup: "fullscreen-swal" },
                }).then((result) => {
                    if (result.isConfirmed) {
                        // تنفيذ التفعيل
                        const stepToActivate = controlData.steps.find(
                            (s) => s.id === stepIdToActivate
                        );
                        if (stepToActivate) {
                            // حفظ الحالة الجديدة
                            saveStepState("current_step", {
                                stepId: stepToActivate.id,
                                stepNo: stepToActivate.no,
                                status: "active",
                            });
                            // تحديث الواجهة فوراً
                            updateCurrentStepFromState(controlData, ordersData);
                            Swal.close(); // إغلاق النافذة المنبثقة
                        }
                    } else {
                        // إذا ألغى المستخدم، تراجع عن تحديد الـ checkbox
                        checkboxElement.checked = false;
                    }
                });
            }
        });
    } catch (listenerError) {
        console.error("Error in addStatusToggleListener:", listenerError);
    }
}
