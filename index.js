document.addEventListener('DOMContentLoaded', function() {

    // =================== 로그인 페이지 =====================
    if (window.location.pathname.includes('LoginPage.html')) {
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('login-button');
        const emailHelper = document.getElementById('email-helper');
        const passwordHelper = document.getElementById('password-helper');
        const loginForm = document.getElementById('login-form');

        // 이메일 유효성 검사
        function validateEmail() {
            const email = emailInput.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email === "") {
                emailHelper.textContent = "";
                return false;
            } else if (!emailRegex.test(email)) {
                emailHelper.textContent = "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
                return false;
            } else {
                emailHelper.textContent = "";
                return true;
            }
        }

        // 3. 비밀번호 유효성 검사 (8-20자, 대/소문자, 숫자, 특수문자 포함)
        function validatePassword() {
            const password = passwordInput.value;
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

            if (password === "") {
                passwordHelper.textContent = "";
                return false;
            } else if (!passwordRegex.test(password)) {
                passwordHelper.textContent = "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
                return false;
            } else {
                passwordHelper.textContent = "";
                return true;
            }
        }

        // 4. 로그인 버튼 활성화
        function updateLoginButtonState() {
            if (validateEmail() && validatePassword()) {
                loginButton.disabled = false;
            } else {
                loginButton.disabled = true;
            }
        }

        // 유효성 검사 및 버튼 상태 업데이트
        emailInput.addEventListener('input', updateLoginButtonState);
        passwordInput.addEventListener('input', updateLoginButtonState);

        // 로그인 버튼 클릭
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const isEmailValid = validateEmail();
            const isPasswordValid = validatePassword();
            
            if (emailInput.value === "") {
                emailHelper.textContent = "이메일을 입력해주세요.";
            }
            if (passwordInput.value === "") {
                passwordHelper.textContent = "비밀번호를 입력해주세요.";
            }

            // 유효성 검사를 통과했을 경우
            if (isEmailValid && isPasswordValid) {

                // 서버로 보낼 데이터를 객체로 만듭니다.
                const loginData = {
                    email: emailInput.value,
                    password: passwordInput.value
                };

                // 서버에 데이터 전송
                fetch('/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' // JSON 형식으로 전송
                    },
                    body: JSON.stringify(loginData) // 데이터를 JSON 문자열로 변환
                })
                .then(response => {
                    // 응답 성공(ok)
                    if (response.ok) { 
                        window.location.href = 'PostListPage.html'; // 게시물 목록 페이지로 이동
                    }
                    // 응답 실패
                    else {
                        passwordHelper.textContent = "아이디 또는 비밀번호를 확인해주세요.";
                    }
                })
                // 예외 상황
                .catch(error => {
                    console.error('로그인 중 오류 발생:', error);
                    passwordHelper.textContent = "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                });
            }
        });
    }


    // =================== 게시글 목록 페이지 ======================
    if (window.location.pathname.includes('PostListPage.html')) { 

        const postListContainer = document.getElementById('post-list');
        const loader = document.getElementById('loader');
        let currentPage = 1; // 현재 페이지 번호
        let isLoading = false; // 로딩 중복 방지
        let hasMorePosts = true; // 더 불러올 게시글이 있는지 여부

        // 숫자 포맷팅 함수 (1000 -> 1k)
        function formatNumber(num) {
            if (num >= 1000) {
                return (num / 1000).toFixed(0) + 'k';
            }  
            return num;
        }

        // 2. 실제 서버에서 게시글 데이터를 가져오는 함수 (fetch 사용)
        async function fetchPosts(page) {
            if (!hasMorePosts) return []; // 더이상 게시글이 없으면 빈 배열 반환

            isLoading = true;
            loader.style.display = 'block';
/*
            try {
                // 페이지 번호와 한 페이지에 보여줄 게시글 수를 쿼리 파라미터로 전달
                const response = await fetch(`/posts?page=${page}&limit=20`);

                // 응답 실패
                if (!response.ok) {
                    throw new Error('서버에서 게시글을 불러오는데 실패했습니다.');
                }
                const posts = await response.json();

                // 다음 페이지가 없을 경우
                if (posts.length < 10) {
                    hasMorePosts = false;
                    loader.style.display = 'none';
                }   
                return posts;

                // 에러 발생
            } catch (error) {
                console.error('게시글 로딩 중 오류 발생:', error);
                loader.innerHTML = '<p>게시글을 불러올 수 없습니다.</p>';
                return [];

            } finally {
                isLoading = false;
                // hasMorePosts가 false가 아닐 때만 로더를 숨김
                if (hasMorePosts) {
                    loader.style.display = 'none';
                }
            }
        */
            console.log(`[테스트 모드] ${page}페이지 데이터 불러오는 중...`);
        // 0.5초간 가짜 로딩 시간을 줍니다.
            await new Promise(resolve => setTimeout(resolve, 500));

        // 10개의 가짜 게시글 데이터를 만듭니다.
            const tempPosts = [];
            for (let i = 1; i <= 10; i++) {
                const id = (page - 1) * 10 + i;
                tempPosts.push({
                    id: id,
                    title: `테스트 게시글 ${id} (제목 26자 넘으면 잘림 테스트 Lorem ipsum dolor sit amet)`,
                    date: '2025-10-21 14:30:00', // (수정) createdAt -> date
                    likes: id * 1500,           // (수정) likesCount -> likes
                    comments: id * 5,         // (수정) commentsCount -> comments
                    views: id * 12000,          // (수정) 이름 동일
                    author: `테스트작성자${id}`,
                    is_modified: i % 3 === 0 ? 1 : 0
                });
            }
        
            isLoading = false;
            loader.style.display = 'none';

        // 3페이지까지만 데이터가 있는 척 (인피니티 스크롤 테스트용)
            if (page >= 3) {
                hasMorePosts = false;
                loader.style.display = 'none';
            }

            return tempPosts; // 가짜 데이터를 반환합니다.



        }
    
        // 게시글 요소를 HTML로 만들어 반환
        function createPostElement(post) {

            // 특정 게시물 클릭 시 상세 페이지로 이동
            const postLink = document.createElement('a');
            postLink.href = `PostDetailPage.html?id=${post.id}`; // 상세 페이지로 링크
            postLink.className = 'post-item';

            // 제목 26자 제한
            const truncatedTitle = post.title.length > 26 ? post.title.substring(0, 26) + '...' : post.title;
        
            // is_modified가 1일 때만 (수정됨) 태그를 생성
            const modifiedTag = post.is_modified === 1 ? '<span class="modified-tag">(수정됨)</span>' : '';
            
            // HTML 변환 
            postLink.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${truncatedTitle}</h3>
                    ${modifiedTag}
                </div>
                <div class="post-meta">
                    <div class="post-meta-stats">
                        <span>좋아요 ${formatNumber(post.likes)}</span>
                        <span>댓글 ${formatNumber(post.comments)}</span>
                        <span>조회수 ${formatNumber(post.views)}</span>
                    </div>
                    <span class="post-date">${new Date(post.date).toLocaleString()}</span>
                </div>
                <div class="post-footer">
                    <div class="post-author">
                        <div class="author-avatar"></div>
                        <span class="author-name">${post.author}</span>
                    </div>
                </div>`;
            return postLink;
        }

        // 추가 게시물 로드
        async function loadMorePosts() {
            if (isLoading) return; // 이미 로딩 중이면 실행 안 함

            const posts = await fetchPosts(currentPage);
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postListContainer.appendChild(postElement);
            });
            currentPage++; // 다음 페이지 준비
        }

        // 인피니티 스크롤
        const observer = new IntersectionObserver((entries) => {
            // entries[0].isIntersecting이 true이면 loader가 화면에 보인다는 의미
            if (entries[0].isIntersecting) {
                loadMorePosts();
            }
        }, {
            threshold: 1.0 // loader가 100% 보일 때 실행
        });

        // loader 요소 관찰 시작
        observer.observe(loader);

        // 첫 페이지 로드
        loadMorePosts();
    }
});