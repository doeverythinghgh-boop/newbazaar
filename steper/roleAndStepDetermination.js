/**
 * @file roleAndStepDetermination.js
 * @description دوال تحديد الدور والحالة (Role and State Determination).
 */

import { loadStepState } from "./stateManagement.js";
import { ADMIN_IDS } from "./config.js";

/**
 * @description يحدد نوع المستخدم بناءً على القواعد المحددة.
 * @param {string} userId - معرف المستخدم الحالي.
 * @param {Array<Object>} ordersData - بيانات الطلبات.
 * @param {Object} controlData - بيانات التحكم (لم تستخدم هنا لكن تم الحفاظ على التوقيع).
 * @returns {string|null} - نوع المستخدم أو null إذا لم يتم العثور عليه.
 */
export function determineUserType(userId, ordersData, controlData) {
    try {
        // 1. التحقق مما إذا كان المستخدم هو admin
        if (ADMIN_IDS.includes(userId)) {
            return "admin";
        }

        // 2. البحث في الطلبات لتحديد الأدوار الأخرى
        let isBuyer = false;
        let isSeller = false;
        let isCourier = false;

        for (const order of ordersData) {
            if (order.user_key === userId) isBuyer = true;
            for (const item of order.order_items) {
                if (item.seller_key === userId) isSeller = true;
                // التحقق الآمن من وجود supplier_delivery ثم delivery_key
                if (
                    item.supplier_delivery &&
                    item.supplier_delivery.delivery_key === userId
                )
                    isCourier = true;
            }
        }

        // 3. معالجة تضارب الأدوار
        if (isBuyer && isSeller) {
            console.error(
                "Fatal Error: Query unacceptable. User cannot be both 'seller' and 'buyer'. Please review data."
            );
            return null;
        }

        // 4. إرجاع الدور بناءً على الأولوية
        if (isSeller) return "seller";
        if (isBuyer) return "buyer";
        if (isCourier) return "courier";

        // 5. في حالة عدم تطابق أي دور
        console.error(
            `Fatal Error: No role found for user ID '${userId}'. Stopping execution.`
        );
        return null;
    } catch (roleError) {
        console.error("Error in determineUserType:", roleError);
        return null;
    }
}

/**
 * @description يحدد الخطوة الحالية بناءً على البيانات المحفوظة في LocalStorage.
 * @param {Object} controlData - بيانات التحكم.
 * @returns {{stepId: string, stepNo: string}} - معرف الخطوة الحالية ورقمها.
 */
export function determineCurrentStepId(controlData) {
    try {
        // 1. حاول تحميل الخطوة الحالية مباشرة من localStorage
        const savedCurrentStep = loadStepState("current_step");
        if (savedCurrentStep && savedCurrentStep.stepId) {
            return savedCurrentStep;
        }

        // دالة مساعدة للحصول على رقم الخطوة بأمان
        const getStepNo = (id, defaultNo) =>
            controlData.steps.find((s) => s.id === id)?.no || defaultNo;

        // 2. إذا لم تكن محفوظة، قم بتحديدها بناءً على حالات الخطوات الأخرى (منطق احتياطي)
        const deliveredState = loadStepState("step-delivered");
        const confirmedState = loadStepState("step-confirmed");
        const reviewState = loadStepState("step-review");

        // ترتيب الأولوية من الأحدث للأقدم
        if (deliveredState) {
            return {
                stepId: "step-delivered",
                stepNo: getStepNo("step-delivered", "4"),
                status: "active",
            };
        }
        if (confirmedState) {
            return {
                stepId: "step-shipped",
                stepNo: getStepNo("step-shipped", "3"),
                status: "active",
            };
        }
        if (reviewState) {
            return {
                stepId: "step-confirmed",
                stepNo: getStepNo("step-confirmed", "2"),
                status: "active",
            };
        }

        // 3. الحالة الافتراضية عند عدم وجود أي بيانات محفوظة على الإطلاق
        return {
            stepId: "step-review",
            stepNo: getStepNo("step-review", "1"),
            status: "active",
        };
    } catch (stepError) {
        console.error("Error in determineCurrentStepId:", stepError);
        // إرجاع الافتراضي في حالة الفشل
        return {
            stepId: "step-review",
            stepNo: controlData.steps.find((s) => s.id === "step-review")?.no || "1",
            status: "active",
        };
    }
}

/**
 * @description التحقق مما إذا كانت الخطوة مسموحة للمستخدم الحالي.
 * @param {string} stepId - معرف الخطوة المراد التحقق منها.
 * @param {object} data - بيانات التحكم التي تحتوي على صلاحيات المستخدم.
 * @returns {boolean} - هل الخطوة مسموحة أم لا.
 */
export function isStepAllowedForCurrentUser(stepId, data) {
    try {
        const currentUserType = data.currentUser.type;
        const userPermissions = data.users.find(
            (user) => user.type === currentUserType
        );

        if (userPermissions && userPermissions.allowedSteps) {
            return userPermissions.allowedSteps.includes(stepId);
        }
        return false;
    } catch (permissionError) {
        console.error("Error in isStepAllowedForCurrentUser:", permissionError);
        return false;
    }
}
