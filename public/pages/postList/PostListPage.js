const API_BASE_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/posts') { 

        const postListContainer = document.getElementById('post-list');
        const loader = document.getElementById('loader');

        let currentCursorId = null; 
        let isLoading = false; 
        let hasMorePosts = true;

        // 숫자 포맷팅 함수 (1000 -> 1k)
        function formatNumber(num) {
            if (num >= 1000) {
                return (num / 1000).toFixed(0) + 'k';
            }  
            return num;
        }

        // 서버에서 게시글 데이터를 가져옴
        async function fetchPosts(cursorId) {
            isLoading = true;
            loader.style.display = 'block';

            try {
                const url = new URL(`${API_BASE_URL}/posts`);
                url.searchParams.append('size', '20'); // 컨트롤러의 기본값
                if (cursorId) { // 첫 페이지 로드가 아닐 때만 cursorId 추가
                    url.searchParams.append('cursorId', cursorId);
                }

                const response = await fetch(url);
                const apiResponse = await response.json();

                if (!response.ok || !apiResponse.success) {
                    throw new Error(apiResponse.message || '서버에서 게시글을 불러오는데 실패했습니다.');
                }

                const slice = apiResponse.data; // slice 객체 (from Spring Data)
                const posts = slice.content;    // 실제 게시글 배열

                // Slice의 'last' 프로퍼티로 다음 페이지 여부 확인
                hasMorePosts = !slice.last;

                if (!hasMorePosts) {
                    loader.style.display = 'none'; // 더 이상 로드할 게 없으면 로더 숨김
                }   
                
                // 다음 요청에 사용할 '커서 ID' 업데이트
                if (posts.length > 0) {
                    // (가정) GetPostListResponse DTO에 postId 필드가 있다고 가정
                    currentCursorId = posts[posts.length - 1].postId; 
                }
                return posts;

                // 에러 발생
            } catch (error) {
                console.error('게시글 로딩 중 오류 발생:', error);
                loader.innerHTML = '<p>게시글을 불러올 수 없습니다.</p>';
                hasMorePosts = false;
                return [];

            } finally {
                isLoading = false;
                if (hasMorePosts) {
                    loader.style.display = 'none';
                }
            }
        }
    
        // 게시글 요소를 HTML로 만들어 반환
        function createPostElement(post) {

            // 특정 게시물 클릭 시 상세 페이지로 이동
            const postLink = document.createElement('a');
            postLink.href = `/posts/${post.postId}`;
            postLink.className = 'post-item';

            // 제목 26자 제한
            const truncatedTitle = post.title.length > 26 ? post.title.substring(0, 26) + '...' : post.title;
        
            // is_modified가 1일 때만 (수정됨) 태그를 생성
            const modifiedTag = post.is_modified ? '<span class="modified-tag">(수정됨)</span>' : '';
            
            // HTML 변환 
            postLink.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${truncatedTitle}</h3>
                    ${modifiedTag}
                </div>
                <div class="post-meta">
                    <div class="post-meta-stats">
                        <span>좋아요 ${formatNumber(post.likeCount)}</span>
                        <span>댓글 ${formatNumber(post.commentCount)}</span>
                        <span>조회수 ${formatNumber(post.viewCount)}</span>
                    </div>
                    <span class="post-date">${new Date(post.date).toLocaleString()}</span>
                </div>
                <div class="post-footer">
                    <div class="post-author">
                        <div class="author-avatar"></div>
                        <span class="author-name">${post.nickname}</span>
                    </div>
                </div>`;
            return postLink;
        }

        // 추가 게시물 로드
        async function loadMorePosts() {
            const posts = await fetchPosts(currentCursorId); 
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postListContainer.appendChild(postElement);
            });
        }

        // 인피니티 스크롤
        const observer = new IntersectionObserver((entries) => {
            // entries[0].isIntersecting이 true이면 loader가 화면에 보인다는 의미
            if (entries[0].isIntersecting && !isLoading && hasMorePosts) {
                loadMorePosts();
            }
        }, {
            threshold: 1.0 // loader가 100% 보일 때 실행
        });

        observer.observe(loader);
        // 첫 페이지 로드
        loadMorePosts();
    }
});