import commentTemplate from '../templates/coomment.hbs';
import postTemplate from '../templates/post.hbs';

const API_URL = 'https://6aaed43f606bd915d111128b.mockapi.io/api/posts';
const COMMENTS_API_URL = 'https://6aaed43f606bd915d111128b.mockapi.io/api/comments';

let createPostForm = document.getElementById('createPostForm');
let posts = document.getElementById('postsList');
let loadingMessage = document.getElementById('loadingMessage');
let errorMessage = document.getElementById('errorMessage')
let emptyState = document.getElementById('emptyState');
let state = {
    posts: [],
    comments: []
};

async function fetcJson(url) {
    let response = await fetch(url);
    if (!response.ok) {
        throw new error('error' + response.status);
    } else {
        let data = await response.json()
        return data;
    }
}

function renderPosts(data) {
    posts.innerHTML = '';
    if (data.length === 0) {
        emptyState.hidden = false;
    }
    emptyState.hidden = true;
    data.forEach(x => {
        let html = postTemplate(x);
        posts.insertAdjacentHTML('beforeend', html);
        let card = posts.lastElementChild;
        const commentsCount = state.comments.filter((comment) => {
            return Number(comment.postId) === Number(x.id);
        }).length;
        let countEl = card.querySelector('[data-comment-count]');
        countEl.textContent = commentsCount;
    });
}

async function loadApp() {
    loadingMessage.hidden = false;
    errorMessage.hidden = true;
    emptyState.hidden = true;
    try {
        let [postResponse, commentResponse] = await Promise.all([fetcJson(API_URL), fetcJson(COMMENTS_API_URL)]);
        state.posts = postResponse;
        state.comments = commentResponse;
        renderPosts(postResponse)
    } catch (error) {
        console.log(error)
        errorMessage.hidden = false;
        posts.innerHTML = '';
    } finally {
        loadingMessage.hidden = true;
    }
}

async function renderComments(id, card) {
    try {
        let commentsList = card.querySelector('[data-comments-list]');
        commentsList.innerHTML = '';
        let postComments = state.comments.filter(x => {
            return Number(x.postId) === Number(id);
        });
        postComments.forEach(x => {
            console.log(x)
            commentsList.insertAdjacentHTML('afterbegin', commentTemplate(x))
        })
    } catch (error) {
        console.log(error)
    }
}

posts.addEventListener('click', (event) => {
    let target = event.target;
    if (target.classList.contains('comments-toggle')) {
        let closestArticle = target.closest('article');
        let commentsPanel = closestArticle.querySelector("[data-comments-panel]");
        let id = closestArticle.dataset.postId;
        let isExpanded = target.getAttribute('aria-expanded') === 'true';
        commentsPanel.hidden = isExpanded;
        target.setAttribute('aria-expanded', !isExpanded)
        if (!isExpanded) {
            renderComments(id, closestArticle);
        }
    }
    else {
        return;
    }
})

async function addComment(data, id) {
    try {
        let response = await fetch(COMMENTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.author,
                body: data.comment,
                postId: data.postId
            })
        });
        console.log(response.status, data)
        if (!response.ok) {
        throw new error('error' + response.status);
    }
    await renderComments(id, data.card)
    } catch (error){
        console.log(error)
    }
}

posts.addEventListener('submit', (event) => {
    event.preventDefault()
    let target = event.target;
    if (target.classList.contains('comment-form')) {
        let textarea = target.querySelector('textarea');
        let input = target.querySelector('input');
        let id = target.closest('article').getAttribute('data-post-id');
        let data = {
            author: textarea.value,
            comment: input.value,
            postId: id,
            card: target.closest('article')
        }
        addComment(data, id);
    }
})

async function makePost(data) {
    try {
        let response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                createdAt: data.createdAt,
                author: data.author,
                title: data.title,
                body: data.body,
                avatar: null
            })
        });
        if (!response.ok) {
            throw new Error('error' + response.status);
        }
        await loadApp()
    } catch (error) {
        console.log(error)
    }
}

createPostForm.addEventListener('submit', (event) => {
    event.preventDefault()
    let data = {
        author: createPostForm.querySelector('[name = "author"]').value,
        title: createPostForm.querySelector('[name = "title"]').value,
        body: createPostForm.querySelector("[name = 'body']").value,
        createdAt: new Date()
    };
    makePost(data)
})

loadApp()