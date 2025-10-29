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

    // 회원가입 페이지인 경우, 뒤로가기(로그인 페이지) 버튼 활성화
    if (currentPage.includes('/signup')) {
        backButton.style.display = 'block';
        backButton.addEventListener('click', () => {
            window.location.href = '/login';
        });
    }
    // 게시글 상세, 작성 페이지인 경우, 프로필 아이콘/뒤로가기(게시물 목록) 버튼 활성화
    else if (currentPage.includes('/post/create')) {
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
        // 프로필 아이콘 숨김 (아무것도 안 함)
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

    if (profileIcon) {
        profileIcon.addEventListener('click', function() {
            profileMenu.classList.toggle('show');
        });
    }
}