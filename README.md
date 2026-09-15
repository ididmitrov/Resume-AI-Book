# Prompt Engineering — Resume Book

Резюмета на лекциите: таб = голяма тема, карти = подтеми.

Публичен линк след GitHub Pages:

https://ididmitrov.github.io/Prompt-Engineering-Resume-Book/

Сайтът е само HTML, CSS и JavaScript — без Node, Vite или build стъпка.

## Какво качваш в GitHub

**Да:**

- `index.html`
- `css/`
- `js/` (`lectures.js` са резюметата, `app.js` е логиката)
- `.nojekyll`
- `.gitignore`
- `README.md`
- `.github/workflows/pages.yml`

**Не:**

- `Презентации/` — pptx файловете не трябват на студентите

## GitHub Pages

1. Качи файловете в `main`.
2. В репото: **Settings → Pages → Source → GitHub Actions**.
3. След минута-две сайтът е на линка горе.

При всяко следващо качване в `main` сайтът се обновява сам.

Ако Actions все още не тръгва, алтернатива без workflow:

1. **Settings → Pages → Source → Deploy from a branch**
2. Branch: `main`, folder: `/ (root)`
3. Save
