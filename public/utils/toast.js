// 토스트 메시지 표시 함수
export function showToast(message, duration = 5000) {
    // 기존 토스트가 있으면 제거
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.textContent = message;
    
    // 토스트 스타일 적용
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: toastSlideIn 0.3s ease-out;
    `;

    // 애니메이션 스타일 추가 (한 번만)
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            @keyframes toastSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // body에 추가
    document.body.appendChild(toast);

    // 지정된 시간 후 제거
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// 페이지 이동 후에도 토스트를 표시하기 위한 함수
export function showToastAfterRedirect(message, duration = 5000) {
    // localStorage에 토스트 메시지 저장
    localStorage.setItem('pendingToast', JSON.stringify({ message, duration }));
}

// 페이지 로드 시 저장된 토스트 메시지 표시
export function checkPendingToast() {
    const pendingToast = localStorage.getItem('pendingToast');
    if (pendingToast) {
        try {
            const { message, duration } = JSON.parse(pendingToast);
            localStorage.removeItem('pendingToast');
            // DOM이 로드된 후 토스트 표시
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => showToast(message, duration), 100);
                });
            } else {
                setTimeout(() => showToast(message, duration), 100);
            }
        } catch (error) {
            console.error('토스트 메시지 파싱 오류:', error);
            localStorage.removeItem('pendingToast');
        }
    }
}

// 페이지 로드 시 자동으로 저장된 토스트 확인
checkPendingToast();

