document.addEventListener('DOMContentLoaded', () => {
    fetch('./control.json')
        .then(response => response.json())
        .then(data => {
            const users = data.users;
            const currentStepId = data.currentStep.id;
            highlightCurrentStep(currentStepId);
            addStepClickListeners(data);
        })
        .catch(error => console.error('Error fetching data:', error));

    function addStepClickListeners(data) {
        const stepItems = document.querySelectorAll('.step-item');
        stepItems.forEach(stepItem => {
            stepItem.addEventListener('click', () => {
                const stepId = stepItem.id;
                if (!isStepAllowedForCurrentUser(stepId, data)) {
                    showUnauthorizedAlert();
                }
            });
        });
    }
    function highlightCurrentStep(stepId) {
        const stepItem = document.getElementById(stepId);
        if (stepItem) {
            stepItem.classList.add('current');
            animateStep(stepItem.querySelector('.step-circle'));
        }
    }

    function animateStep(circle) {
        circle.style.animation = 'pulse 1.5s infinite';
    }

    function isStepAllowedForCurrentUser(stepId, data) {
      const currentUser = data.currentUser.type;
      const user = data.users.find(user => user.type === currentUser);
      if (user && user.allowedSteps) {
          return user.allowedSteps.includes(stepId);
      }
      return false;
    }

    function showUnauthorizedAlert() {
        Swal.fire({
            title: 'غير مسموح!',
            text: 'ليس لديك صلاحية الوصول إلى هذه الخطوة.',
            icon: 'warning',
            confirmButtonText: 'حسنًا'
        });
    }

});