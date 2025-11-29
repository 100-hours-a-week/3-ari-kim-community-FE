// 토스트 함수 import
import { showToast, showToastAfterRedirect, checkPendingToast } from '/utils/toast.js';

// 페이지 로드 시 저장된 토스트 메시지 확인
checkPendingToast();

// DOM이 이미 로드되었는지 확인
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    // DOM이 이미 로드된 경우 즉시 실행
    loadHeader();
}

// 공통 header 적용
function loadHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    
    // header-placeholder 요소가 없으면 종료
    if (!headerPlaceholder) {
        console.error('header-placeholder 요소를 찾을 수 없습니다.');
        return;
    }
    
    fetch('/layout/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            headerPlaceholder.innerHTML = data;

            // CSS가 이미 로드되어 있는지 확인
            if (!document.querySelector('link[href="/layout/header.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = '/layout/header.css';
                document.head.appendChild(link);
            }

            // 헤더가 완전히 렌더링된 후 실행
            setTimeout(() => {
                setupHeaderUI();
                activateDropdown();
                setupLogoutButton();
                updateProfileImage(); // 프로필 이미지 설정
            }, 100); // 약간의 지연을 두어 DOM이 완전히 렌더링되도록 함
        })
        .catch(error => {
            console.error('헤더 로드 실패:', error);
            // 에러 발생 시 사용자에게 표시
            headerPlaceholder.innerHTML = '<div style="padding: 10px; color: red;">헤더를 불러올 수 없습니다.</div>';
        });
}

// 프로필 이미지 업데이트 함수 (전역으로 노출)
window.updateProfileImage = function() {
    const profileIcon = document.getElementById('profile-icon');
    if (profileIcon) {
        const profileUrl = localStorage.getItem('userProfileUrl');
        console.log('프로필 이미지 업데이트 시도:', profileUrl);
        if (profileUrl && profileUrl.trim() !== '') {
            // 이미지 로드 테스트를 위한 img 요소 생성
            const testImg = new Image();
            testImg.onload = function() {
                console.log('프로필 이미지 로드 성공:', profileUrl);
                profileIcon.style.backgroundImage = `url(${profileUrl})`;
                profileIcon.style.backgroundSize = 'cover';
                profileIcon.style.backgroundPosition = 'center';
                profileIcon.style.backgroundColor = 'transparent';
            };
            testImg.onerror = function() {
                console.error('프로필 이미지 로드 실패:', profileUrl);
                // 이미지 로드 실패 시 기본 배경색 유지
                profileIcon.style.backgroundImage = 'none';
                profileIcon.style.backgroundColor = '#e0e0e0';
            };
            testImg.src = profileUrl;
        } else {
            // 프로필 이미지가 없으면 기본 배경색 유지
            console.log('프로필 URL이 없음');
            profileIcon.style.backgroundImage = 'none';
            profileIcon.style.backgroundColor = '#e0e0e0';
        }
    } else {
        console.warn('profile-icon 요소를 찾을 수 없습니다.');
    }
};

// localStorage 변경 감지하여 프로필 이미지 업데이트
window.addEventListener('storage', function(e) {
    if (e.key === 'userProfileUrl') {
        updateProfileImage();
    }
});

// 같은 페이지 내에서 localStorage 변경 감지 (storage 이벤트는 다른 탭에서만 발생)
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'userProfileUrl') {
        updateProfileImage();
    }
};

function setupHeaderUI() {
    const currentPage = window.location.pathname;
    const backButton = document.getElementById('back-button');
    const profileContainer = document.getElementById('profile-container');
    const profileMenu = document.getElementById('profile-menu');

    // 로그인 상태에 따라 드롭다운 메뉴 초기화
    const accessToken = localStorage.getItem('accessToken');
    if (profileMenu) {
        const menuItems = profileMenu.querySelector('ul');
        if (menuItems) {
            if (!accessToken) {
                // 로그인하지 않은 경우 로그인 메뉴 표시
                menuItems.innerHTML = '<li><a href="/login" id="login-menu-item">로그인</a></li>';
            } else {
                // 로그인한 경우 기본 메뉴 표시 (Express 라우팅 경로 사용)
                const userId = localStorage.getItem('userId');
                menuItems.innerHTML = `<li><a href="/users/${userId}/edit">회원정보 수정</a></li><li><a href="/users/${userId}/password">비밀번호 수정</a></li><li><a href="#" id="logout-button">로그아웃</a></li>`;
            }
        }
    }

    // 회원가입 페이지인 경우, 뒤로가기(로그인 페이지) 버튼 활성화
    if (currentPage.includes('/signup') && backButton) {
        backButton.style.display = 'block';
        backButton.addEventListener('click', () => {
            window.location.href = '/login';
        });
    }
    // 게시글 상세, 작성 페이지인 경우, 프로필 아이콘/뒤로가기(게시물 목록) 버튼 활성화
    else if (currentPage.includes('/posts/create')) {
        if (backButton) {
            backButton.style.display = 'block';
            backButton.addEventListener('click', () => {
                window.location.href = '/';
            });
        }
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
    }
    // 게시글 수정 페이지인 경우, 프로필 아이콘/뒤로가기(게시물 상세) 버튼 활성화
    else if (currentPage.includes('/posts/') && currentPage.includes('/edit')) {
        if (backButton) {
            backButton.style.display = 'block';
            // URL에서 postId 추출: /posts/123/edit -> 123
            const pathParts = currentPage.split('/');
            const postIdIndex = pathParts.indexOf('posts') + 1;
            const postId = postIdIndex > 0 && pathParts[postIdIndex] ? pathParts[postIdIndex] : null;
            backButton.addEventListener('click', () => {
                if (postId) {
                    window.location.href = `/posts/${postId}`;
                } else {
                    window.location.href = '/';
                }
            });
        }
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
    }
    // 게시글 상세 페이지인 경우
    else if (currentPage.match(/^\/posts\/\d+$/)) {
        if (backButton) {
            backButton.style.display = 'block';
            backButton.addEventListener('click', () => {
                window.location.href = '/';
            });
        }
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
    }
    // 로그인 페이지 
    else if (currentPage.includes('/login') && backButton) {
        backButton.style.display = 'block';
        backButton.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    // 회원정보 수정, 비밀번호 수정 페이지인 경우, 뒤로가기(메인 페이지) 버튼 활성화
    else if ((currentPage.includes('/users/') && currentPage.includes('/edit')) || 
             (currentPage.includes('/users/') && currentPage.includes('/password'))) {
        if (backButton) {
            backButton.style.display = 'block';
            backButton.addEventListener('click', () => {
                window.location.href = '/';
            });
        }
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
    }
    // 그 외 모든 페이지, 프로필 아이콘 활성화
    else {
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
    }
}

//  프로필 아이콘을 클릭했을 때 드롭다운 메뉴
function activateDropdown() {
    const profileIcon = document.getElementById('profile-icon');
    const profileMenu = document.getElementById('profile-menu');

    if (profileIcon && profileMenu) {
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });

        // 메뉴 외부 클릭 시 닫기
        document.addEventListener('click', function(e) {
            if (!profileIcon.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove('show');
            }
        });
    }
}

// 로그아웃 버튼 이벤트 리스너 설정 (한 번만 등록)
let logoutButtonSetup = false;
function setupLogoutButton() {
    // 이미 설정되었으면 중복 등록 방지
    if (logoutButtonSetup) return;
    logoutButtonSetup = true;
    
    // 이벤트 위임을 사용하여 동적으로 생성된 로그아웃 버튼 처리
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'logout-button') {
            e.preventDefault();
            handleLogout();
        }
    });
}

// 로그아웃 처리 함수
function handleLogout() {
    // localStorage에서 토큰 및 사용자 정보 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userProfileUrl');
    
    // 프로필 이미지를 기본값으로 초기화
    const profileIcon = document.getElementById('profile-icon');
    if (profileIcon) {
        profileIcon.style.backgroundImage = 'none';
        profileIcon.style.backgroundColor = '#e0e0e0';
    }
    
    // 페이지 이동 후에도 토스트를 표시하기 위해 localStorage에 저장
    showToastAfterRedirect('로그아웃 되었습니다');
    
    // 메인 페이지(게시물 목록 페이지)로 즉시 이동
    window.location.href = '/';
}