document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
});

// 공통 header 적용
function loadHeader() {
    fetch('/layout/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            const head = document.head;
            const link = document.createElement('link');
            
            link.rel = 'stylesheet'
            link.type = 'text/css';
            link.href = '/layout/header.css';
            
            head.appendChild(link);

            setupHeaderUI();
            activateDropdown();
        });
}

function setupHeaderUI() {
    const currentPage = window.location.pathname;
    const backButton = document.getElementById('back-button');
    const profileContainer = document.getElementById('profile-container');
    const profileMenu = document.getElementById('profile-menu');

    // 로그인 상태에 따라 드롭다운 메뉴 초기화
    const accessToken = localStorage.getItem('accessToken');
    if (profileMenu) {
        const menuItems = profileMenu.querySelector('ul');
        if (!accessToken) {
            // 로그인하지 않은 경우 로그인 메뉴 표시
            menuItems.innerHTML = '<li><a href="/login" id="login-menu-item">로그인</a></li>';
        } else {
            // 로그인한 경우 기본 메뉴 표시
            menuItems.innerHTML = '<li><a href="../pages/userUpdate/UserUpdatePage.html">회원정보 수정</a></li><li><a href="../pages/passwordUpdate/PasswordUpdatePage.html">비밀번호 수정</a></li><li><a href="#" id="logout-button">로그아웃</a></li>';
        }
    }

    // 회원가입 페이지인 경우, 뒤로가기(로그인 페이지) 버튼 활성화
    if (currentPage.includes('/signup')) {
        backButton.style.display = 'block';
        backButton.addEventListener('click', () => {
            window.location.href = '/login';
        });
    }
    // 게시글 상세, 작성 페이지인 경우, 프로필 아이콘/뒤로가기(게시물 목록) 버튼 활성화
    else if (currentPage.includes('/posts/create')) {
        backButton.style.display = 'block';
        profileContainer.style.display = 'block';
        backButton.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    // 게시글 수정 페이지인 경우, 프로필 아이콘/뒤로가기(게시물 상세) 버튼 활성화
    else if (currentPage.includes('/post/:id/edit')) {
        backButton.style.display = 'block';
        profileContainer.style.display = 'block';
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        backButton.addEventListener('click', () => {
            if (postId) {
            window.location.href = `../postDetail/PostDetailPage.html?id=${postId}`;
            } else {
            window.location.href = '../postList/PostListPage.html';
            }
        });
    }
    // 상세 페이지 
    else if (currentPage.startsWith('/posts/:id')) { 
        backButton.style.display = 'block';
        profileContainer.style.display = 'block';
        backButton.addEventListener('click', () => {
            window.location.href = '/'; // (수정)
        });
    }
    // 로그인 페이지 
    else if (currentPage.includes('/login')) {
        backButton.style.display = 'block';
        backButton.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    // 그 외 모든 페이지, 프로필 아이콘 활성화
    else {
        profileContainer.style.display = 'block';
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