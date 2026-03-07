/* ── script.js ── */

// ── State ──
const TOPICS = ['what-is-git', 'repository', 'commit', 'branch-merge', 'pull-request', 'workflow'];
const completedTopics = new Set();
const STORAGE_KEY = 'gh-basics-progress';
const THEME_KEY   = 'gh-basics-theme';

// ── Dark / Light Mode ──
function toggleTheme() {
  const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// ── Progress persistence ──
function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedTopics]));
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    saved.forEach(topicId => {
      if (!TOPICS.includes(topicId)) return;
      completedTopics.add(topicId);
      const markBtn = document.querySelector(`.mark-done-btn[data-topic="${topicId}"]`);
      if (markBtn) {
        markBtn.textContent = 'Completed ✓';
        markBtn.classList.add('done-btn');
        markBtn.disabled = true;
      }
      const tabBtn = document.querySelector(`[data-tab="${topicId}"]`);
      if (tabBtn) tabBtn.classList.add('done');
    });
    updateProgress();
  } catch (e) { /* ignore corrupt data */ }
}

// ── Tab navigation ──
function showTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  const panel = document.getElementById(tabId);
  const btn   = document.querySelector(`[data-tab="${tabId}"]`);
  if (panel) panel.classList.add('active');
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
}

// ── Progress tracking ──
function markDone(topicId, btn) {
  completedTopics.add(topicId);
  btn.textContent = 'Completed ✓';
  btn.classList.add('done-btn');
  btn.disabled = true;

  const tabBtn = document.querySelector(`[data-tab="${topicId}"]`);
  if (tabBtn) tabBtn.classList.add('done');

  updateProgress();
  saveProgress();

  // Auto-advance to next topic
  const idx  = TOPICS.indexOf(topicId);
  const next = TOPICS[idx + 1];
  if (next) {
    setTimeout(() => showTab(next), 600);
  }
}

function updateProgress() {
  const total   = TOPICS.length;
  const done    = completedTopics.size;
  const pct     = (done / total) * 100;

  const bar     = document.getElementById('progressBar');
  const label   = document.getElementById('progressLabel');

  if (bar) {
    bar.style.width = `${pct}%`;
    bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  }
  if (label) label.textContent = `${done} / ${total} topics completed`;
}

// ── Copy-to-clipboard buttons (cheat sheet) ──
function initCopyButtons() {
  document.querySelectorAll('.cheat-row:not(.header)').forEach(row => {
    const codeEl = row.querySelector('code');
    if (!codeEl) return;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.title = 'Copy to clipboard';
    btn.setAttribute('aria-label', 'Copy command to clipboard');
    btn.textContent = '📋';

    btn.addEventListener('click', () => {
      const text = codeEl.textContent;
      const finish = () => {
        btn.textContent = '✓';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(finish).catch(() => { /* silent fail */ });
      } else {
        // Fallback for older browsers
        const range = document.createRange();
        range.selectNode(codeEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        sel.removeAllRanges();
        finish();
      }
    });

    // Wrap the <code> and button together
    const wrapper = document.createElement('span');
    wrapper.className = 'cheat-cmd';
    codeEl.parentNode.insertBefore(wrapper, codeEl);
    wrapper.appendChild(codeEl);
    wrapper.appendChild(btn);
  });
}

// ── Repo diagram ──
const repoDetails = {
  files: {
    title: '📄 Files & Folders',
    text: 'Just like a regular folder — your source code, documentation, configs, etc. Git watches every file for changes.'
  },
  history: {
    title: '🕐 Commit History',
    text: 'An immutable, ordered list of every commit ever made. You can click any commit on GitHub to see exactly what changed.'
  },
  branches: {
    title: '🌿 Branches',
    text: 'Parallel lines of work. The "main" branch is your stable codebase; feature branches let developers work without interference.'
  },
  issues: {
    title: '🐛 Issues & PRs',
    text: 'GitHub\'s built-in project tracker. Issues are tasks/bugs; PRs are proposed code changes awaiting review. Both are linked to code.'
  }
};

function showRepoDetail(key) {
  const box = document.getElementById('repoDetailBox');
  if (!box) return;
  const d = repoDetails[key];
  if (!d) return;
  box.innerHTML = `<strong>${d.title}</strong><br/><span class="text-muted">${d.text}</span>`;
}

// ── Commit part highlight ──
function highlightPart(el) {
  document.querySelectorAll('.commit-part').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

// ── PR Step toggle ──
function toggleStep(el) {
  const wasActive = el.classList.contains('active');
  document.querySelectorAll('.pr-step').forEach(s => s.classList.remove('active'));
  if (!wasActive) el.classList.add('active');
}

// ── Workflow explanation ──
const workflowExplanations = {
  1: {
    icon: '☁️',
    title: 'Clone / Pull',
    text: '<strong>Clone</strong>: Download a copy of the repo to your machine for the first time. <strong>Pull</strong>: Sync your local copy with the latest changes from GitHub. Developers run <code>git pull</code> at the start of each day.'
  },
  2: {
    icon: '🌿',
    title: 'Create a Branch',
    text: 'Create a new branch for your work: <code>git checkout -b feature/my-feature</code>. This keeps your changes isolated from <code>main</code> until they\'re ready.'
  },
  3: {
    icon: '✍️',
    title: 'Write Code',
    text: 'The developer writes the code for their feature or bug fix. This happens entirely on their local machine — no one else sees it yet.'
  },
  4: {
    icon: '💾',
    title: 'Commit Changes',
    text: 'Stage and save a snapshot: <code>git add . && git commit -m "Add login button"</code>. Good commits are small and focused. Write messages in the imperative tense ("Add" not "Added").'
  },
  5: {
    icon: '⬆️',
    title: 'Push to GitHub',
    text: '<code>git push</code> uploads your local commits to GitHub. Now your branch and its commits are visible to the whole team.'
  },
  6: {
    icon: '🔀',
    title: 'Open a Pull Request',
    text: 'On GitHub, open a PR from your feature branch → <code>main</code>. Write a clear description of <em>what</em> changed and <em>why</em>. Tag reviewers and link any related issues.'
  },
  7: {
    icon: '🚀',
    title: 'Review, Approve & Merge',
    text: 'Reviewers comment on the diff; the author updates commits. Once approved, the PR is merged into <code>main</code>. Most teams then deploy automatically via CI/CD. 🎉'
  }
};

function explainWorkflow(step) {
  document.querySelectorAll('.workflow-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`wf-${step}`);
  if (el) el.classList.add('active');

  const d   = workflowExplanations[step];
  const box = document.getElementById('workflowDetail');
  if (box && d) {
    box.innerHTML = `<strong>${d.icon} Step ${step}: ${d.title}</strong><br/><span class="text-muted">${d.text}</span>`;
  }
}

// ── Quiz ──
const QUESTIONS = [
  {
    q: 'What is a "repository" in Git?',
    options: [
      'A website for downloading software',
      'A project folder that Git tracks, including its full history',
      'A single saved change to a file',
      'A request to merge code changes'
    ],
    correct: 1,
    explanation: '✅ Correct! A repository (repo) is the project folder plus all of its version history.'
  },
  {
    q: 'What is the difference between a commit and a merge?',
    options: [
      'They are the same thing',
      'A commit deletes files; a merge restores them',
      'A commit saves a snapshot within a branch; a merge combines a branch into another',
      'A commit is for documentation; a merge is for code'
    ],
    correct: 2,
    explanation: '✅ Correct! Commits save snapshots inside a branch. Merging brings those changes from one branch into another.'
  },
  {
    q: 'What is the purpose of a Pull Request (PR)?',
    options: [
      'To download the latest code from the internet',
      'To propose and review changes before merging them into the main branch',
      'To delete old branches',
      'To run automated tests'
    ],
    correct: 1,
    explanation: '✅ Correct! A PR is a proposal to merge a branch, allowing the team to review and discuss changes first.'
  },
  {
    q: 'Why should developers work on a feature branch instead of directly on "main"?',
    options: [
      'Branches are faster to work with',
      'GitHub requires it by law',
      'So changes are isolated and reviewed before affecting the stable codebase',
      'Branches use less storage'
    ],
    correct: 2,
    explanation: '✅ Correct! Branches keep work-in-progress isolated, protecting the stable main branch until changes are reviewed and approved.'
  },
  {
    q: 'After pushing commits, what is the next step in the standard GitHub workflow?',
    options: [
      'Delete the branch',
      'Run git clone again',
      'Open a Pull Request on GitHub',
      'Run git status'
    ],
    correct: 2,
    explanation: '✅ Correct! After pushing your branch, you open a Pull Request on GitHub to get your changes reviewed and merged.'
  }
];

let currentQuestion = 0;
let score = 0;
let quizAnswered = false;

function renderQuestion() {
  const q         = QUESTIONS[currentQuestion];
  const qEl       = document.getElementById('quizQuestion');
  const optEl     = document.getElementById('quizOptions');
  const feedEl    = document.getElementById('quizFeedback');
  const nextBtn   = document.getElementById('quizNextBtn');
  const progressEl = document.getElementById('quizProgress');

  if (!qEl) return;

  qEl.textContent  = `Q${currentQuestion + 1}: ${q.q}`;
  feedEl.textContent = '';
  nextBtn.style.display = 'none';
  quizAnswered = false;

  optEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className   = 'quiz-option';
    btn.textContent = opt;
    btn.onclick     = () => answerQuestion(i);
    optEl.appendChild(btn);
  });

  progressEl.textContent = `Question ${currentQuestion + 1} of ${QUESTIONS.length}`;
}

function answerQuestion(selectedIndex) {
  if (quizAnswered) return;
  quizAnswered = true;

  const q       = QUESTIONS[currentQuestion];
  const options = document.querySelectorAll('.quiz-option');
  const feedEl  = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('quizNextBtn');

  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct)   btn.classList.add('correct');
    if (i === selectedIndex && i !== q.correct) btn.classList.add('wrong');
  });

  if (selectedIndex === q.correct) {
    score++;
    feedEl.style.color = 'var(--secondary)';
    feedEl.textContent = q.explanation;
  } else {
    const wrongExplanation = q.explanation.replace(/^✅ Correct!\s*/, '');
    feedEl.style.color = 'var(--danger)';
    feedEl.textContent = `❌ Not quite. ${wrongExplanation}`;
  }

  const isLast = currentQuestion === QUESTIONS.length - 1;
  nextBtn.textContent   = isLast ? 'See Results 🎉' : 'Next Question →';
  nextBtn.style.display = 'inline-block';
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion >= QUESTIONS.length) {
    showQuizResults();
  } else {
    renderQuestion();
  }
}

function showQuizResults() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  const pct   = Math.round((score / QUESTIONS.length) * 100);
  let emoji   = pct === 100 ? '🏆' : pct >= 60 ? '👍' : '📖';
  let message = pct === 100
    ? 'Perfect score! You\'re a GitHub pro!'
    : pct >= 60
    ? 'Great job! Review any topics you missed above.'
    : 'Keep learning! Revisit the tabs above to strengthen your understanding.';

  container.innerHTML = `
    <div class="quiz-complete">
      <div class="quiz-result-emoji">${emoji}</div>
      <div class="score">${score} / ${QUESTIONS.length}</div>
      <p class="quiz-result-message">${message}</p>
      <p class="quiz-result-pct">Score: ${pct}%</p>
      <button class="quiz-next-btn quiz-retry-btn" onclick="restartQuiz()">Retry Quiz 🔄</button>
    </div>
  `;
}

function restartQuiz() {
  currentQuestion = 0;
  score = 0;
  quizAnswered = false;

  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-question" id="quizQuestion"></div>
    <div class="quiz-options" id="quizOptions"></div>
    <div class="quiz-feedback" id="quizFeedback"></div>
    <button class="quiz-next-btn" id="quizNextBtn" onclick="nextQuestion()" style="display:none">Next Question →</button>
    <div class="quiz-progress" id="quizProgress"></div>
  `;
  renderQuestion();
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  restartQuiz();
  loadProgress();
  initCopyButtons();
});
