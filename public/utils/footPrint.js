/**
 * foot 이미지를 생성하고 페이드아웃 애니메이션을 적용하는 공통 함수
 * @param {Object} options - 설정 옵션
 * @param {number} options.containerWidth - 컨테이너 너비 (기본값: 800)
 * @param {number} options.containerPadding - 컨테이너 패딩 (기본값: 40)
 * @param {number} options.headerHeight - 헤더 높이 (기본값: 70)
 * @param {number} options.imageSize - 이미지 크기 (기본값: 60)
 * @param {number} options.fadeDelay - 페이드아웃 시작 지연 시간(ms) (기본값: 1000)
 * @param {number} options.fadeDuration - 페이드아웃 지속 시간(ms) (기본값: 1000)
 * @returns {HTMLElement} 생성된 foot 이미지 요소
 */
export function createFootImage(options = {}) {
    const {
        containerWidth = 800,
        containerPadding = 40,
        headerHeight = 70,
        imageSize = 60,
        fadeDelay = 1000,
        fadeDuration = 1000
    } = options;

    const footImg = document.createElement('img');
    footImg.src = '/images/foot.svg';
    footImg.className = 'foot-print';
    
    const viewportWidth = window.innerWidth;
    const containerTotalWidth = containerWidth + containerPadding;
    const sideSpace = Math.max(20, (viewportWidth - containerTotalWidth) / 2);
    
    // 랜덤으로 왼쪽 또는 오른쪽 선택
    const isLeft = Math.random() < 0.5;
    
    // 세로 위치: 헤더 아래부터 화면 하단까지 (이미지 높이 고려)
    const minTop = headerHeight + 20; // 헤더 아래 여유 공간
    const maxTop = window.innerHeight - imageSize; // 이미지 높이 고려
    const randomTop = Math.max(minTop, Math.random() * (maxTop - minTop) + minTop);
    
    if (isLeft) {
        // 왼쪽 공간에 배치 (컨테이너 왼쪽 경계 밖)
        const maxLeft = sideSpace - imageSize; // 이미지 너비 고려
        footImg.style.left = `${Math.max(10, Math.random() * maxLeft)}px`;
    } else {
        // 오른쪽 공간에 배치 (컨테이너 오른쪽 경계 밖)
        const maxRight = sideSpace - imageSize; // 이미지 너비 고려
        footImg.style.right = `${Math.max(10, Math.random() * maxRight)}px`;
    }
    
    footImg.style.top = `${randomTop}px`;
    
    // 랜덤 회전 각도 (더 다양한 각도 범위)
    const rotation = (Math.random() - 0.5) * 120; // -60도 ~ +60도
    footImg.style.transform = `rotate(${rotation}deg)`;
    
    document.body.appendChild(footImg);
    
    // 페이드아웃 애니메이션
    setTimeout(() => {
        footImg.style.opacity = '0';
        footImg.style.transition = `opacity ${fadeDuration}ms ease-out`;
        
        // 애니메이션 완료 후 DOM에서 제거
        setTimeout(() => {
            if (footImg.parentNode) {
                footImg.parentNode.removeChild(footImg);
            }
        }, fadeDuration);
    }, fadeDelay);
    
    return footImg;
}

/**
 * 로그인 페이지용 자동 반복 foot 이미지 생성기
 * @param {Object} options - 설정 옵션
 * @param {number} options.interval - 이미지 생성 간격(ms) (기본값: 2000)
 * @param {Object} options.footOptions - createFootImage에 전달할 옵션
 * @returns {Function} 중지 함수
 */
export function startAutoFootPrint(options = {}) {
    const {
        interval = 2000,
        footOptions = {}
    } = options;

    let intervalId = setInterval(() => {
        createFootImage(footOptions);
    }, interval);

    // 중지 함수 반환
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };
}

