const API_BASE_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function() {
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

        // 서버에서 게시글 데이터를 가져옴
        async function fetchPosts(page) {
            if (!hasMorePosts) return []; // 더이상 게시글이 없으면 빈 배열 반환
            isLoading = true;
            loader.style.display = 'block';

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
        }
    
        // 게시글 요소를 HTML로 만들어 반환
        function createPostElement(post) {

            // 특정 게시물 클릭 시 상세 페이지로 이동
            const postLink = document.createElement('a');
            postLink.href = `../postDetail/PostDetailPage.html?id=${post.id}`; // 상세 페이지로 링크
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