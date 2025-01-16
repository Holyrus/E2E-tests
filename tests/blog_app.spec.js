// npm init playwright@latest
// In package.json - 
// "scripts": {
//   "test": "playwright test",
//   "test:report": "playwright show-report"
// },
// ...

// Run test via graphical UI with the command: 
// npm run test -- --ui

// App by default use 3 browser engines to test
// For define one engine to be tested use command:
// npm test -- --project chromium

// ----------------------------------------

// For running one by one use:
// test.only('', async ({ page }) => {})

// or run a single test use a command line parameter: 
// npm test -- -g "Front page can be opened"

const { test, expect, describe, beforeEach } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Vero',
        username: 'Veronika',
        password: 'Umka1234'
      }
    })
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Ruslan',
        username: 'Holyrus',
        password: 'Umka4321'
      }
    })

    await page.goto('/')
  })

  test('Front page can be opened', async ({ page }) => {
  
    const locator = await page.getByText('Blogs')
    await expect(locator).toBeVisible()
  
    // -- or --
  
    // await expect(page.getByText('Blogs')).toBeVisible()
  })

  test('Login form can be opened and logged in', async ({ page }) => {

    await page.getByRole('button', { name: 'login' }).click()
    // If textfields only two:
    // await page.getByRole('textbox').first().fill('Veronika')
    // await page.getByRole('textbox').last().fill('Umka1234')

    // if more than two:
    // const textboxes = await page.getByRole('textbox').all()
    // await textboxes[0].fill('Veronika')
    // await textboxes[1].fill('Umka1234')

    // if textfields have a 'data-testid='password' parameter in frontend
    // await page.getByTestId('username').fill('Veronika')
    // await page.getByTestId('password').fill('Umka1234')
    // await page.getByRole('button', { name: 'login' }).click()

    // Using helper.js
    await loginWith(page, 'Veronika', 'Umka1234')

    await expect(page.getByText('Vero logged-in')).toBeVisible()
  })

  test('Login fails with wrong password', async ({ page }) => {
    await page.getByRole('button', { name: 'login' }).click()
    await page.getByTestId('username').fill('Veronika')
    await page.getByTestId('password').fill('WrongPassword')
    await page.getByRole('button', { name: 'login' }).click()

    const errorDiv = await page.locator('.error') // page.locator finds the component with the class .error
    await expect(errorDiv).toContainText('Wrong credentials')
    // Also we can test that error message is red with solid border: 
    await expect(errorDiv).toHaveCSS('border-style', 'solid')
    await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')

    await expect(page.getByText('Vero logged-in')).not.toBeVisible()
  })

  describe('When initially logged in', () => {
    beforeEach(async ({ page }) => {
      // Without using helper.js
      // await page.getByRole('button', { name: 'login' }).click()
      // await page.getByTestId('username').fill('Veronika')
      // await page.getByTestId('password').fill('Umka1234')
      // await page.getByRole('button', { name: 'login' }).click()
      
      // With using helper.js
      await loginWith(page, 'Veronika', 'Umka1234')
    })

    test('A new blog can be created', async ({ page }) => {
      // Without helper.js
      // await page.getByRole('button', { name: 'new blog' }).click()
      // await page.getByTestId('title').fill('Blog by playwright')
      // await page.getByTestId('author').fill('Napoleon')
      // await page.getByTestId('url').fill('http://example')
      // await page.getByTestId('likes').fill('404')
      // await page.getByRole('button', { name: 'Save' }).click()

      // With using helper.js
      await createBlog(page, 'Blog by playwright', 'Napoleon', 'http://example', '404')

      const notificationDiv = await page.locator('.notification')
      await expect(notificationDiv).toContainText('Blog by playwright')
      await expect(page.getByText('No blogs')).not.toBeVisible()
      // await expect(page.getByText('Blog by playwright')).toBeVisible()
    })

    describe('When two blogs exists', () => {
      beforeEach(async ({ page }) => {
      // Without using helper.js
      // await page.getByRole('button', { name: 'new blog' }).click()
      // await page.getByTestId('title').fill('Initial blog')
      // await page.getByTestId('author').fill('playwright')
      // await page.getByTestId('url').fill('http://example')
      // await page.getByTestId('likes').fill('404')
      // await page.getByRole('button', { name: 'Save' }).click()

      // With using helper.js
      await createBlog(page, 'First Initial blog', 'playwright', 'http://example', '404')
      await createBlog(page, 'Second Initial blog', 'playwright', 'http://example', '505')
      })

      test('Blog can be liked', async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Second Initial blog' }).getByRole('button', { name: 'View' }).click()
        await page.getByRole('button', { name: 'Like' }).click()

        await expect(page.getByText('Like added')).toBeVisible()
      })

      test('Blog can be removed', async ({ page }) => {
        const firstInitialBlog = await page.getByText('First Initial Blog').locator('..')
        page.once('dialog', dialog => {
          dialog.accept().catch(() => {})
        })
        await firstInitialBlog.getByRole('button', { name: 'Remove' }).click()
        const notificationDiv = await page.locator('.notification')
        await expect(notificationDiv).toContainText('Blog removed')
        await expect(page.getByText('First Initial Blog')).not.toBeVisible()
      })

      test('Other user cant see delete button', async ({ page }) => {
        await page.getByRole('button', { name: 'Logout' }).click()
        await loginWith(page, 'Holyrus', 'Umka4321')
        await expect(page.getByText('Ruslan logged-in')).toBeVisible()
        await expect(page.locator('li').filter({ hasText: 'Second Initial blog' }).getByRole('button', { name: 'Remove' })).not.toBeVisible()
      })
    })

    describe('When four blogs exists', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, 'Last Initial blog', 'playwright', 'http://example', '1')
        await createBlog(page, 'Third Initial blog', 'playwright', 'http://example', '2')
        await createBlog(page, 'Second Initial blog', 'playwright', 'http://example', '3')
        await createBlog(page, 'First Initial blog', 'playwright', 'http://example', '4')
      })

      test('All blogs arranged in the descending order for likes', async ({ page }) => {
        await page.locator('li').filter({ hasText: 'First Initial blog' }).getByRole('button', { name: 'View' }).click()
        await page.locator('li').filter({ hasText: 'Second Initial blog' }).getByRole('button', { name: 'View' }).click()
        await page.locator('li').filter({ hasText: 'Third Initial blog' }).getByRole('button', { name: 'View' }).click()
        await page.locator('li').filter({ hasText: 'Last Initial blog' }).getByRole('button', { name: 'View' }).click()

        const blogs = page.locator('.blog')
        
        await expect(blogs.nth(0).locator('..').getByText('1')).toBeVisible()
        await expect(blogs.nth(1).locator('..').getByText('2')).toBeVisible()
        await expect(blogs.nth(2).locator('..').getByText('3')).toBeVisible()
        await expect(blogs.nth(3).locator('..').getByText('4')).toBeVisible()
      })
    })
  })
})

// Run problematic test in debug mode:
// npm test -- -g'Blog can be removed' --debug

// As well running in UI mode can be useful
// npm run test -- --ui

// Almoust the save as UI mode
// npm run test -- --trace on

// Playwright includes test generator
// npx playwright codegen http://localhost:5173/
// It records user's interaction and copy locators and actions from user.