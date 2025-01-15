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

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Vero',
        username: 'Veronika',
        password: 'Umka1234'
      }
    })

    await page.goto('http://localhost:5173')
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
    await page.getByTestId('username').fill('Veronika')
    await page.getByTestId('password').fill('Umka1234')

    await page.getByRole('button', { name: 'login' }).click()

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
      await page.getByRole('button', { name: 'login' }).click()
      await page.getByTestId('username').fill('Veronika')
      await page.getByTestId('password').fill('Umka1234')
      await page.getByRole('button', { name: 'login' }).click()
    })

    test('A new blog can be created', async ({ page }) => {
      await page.getByRole('button', { name: 'new blog' }).click()
      
      await page.getByTestId('title').fill('Blog by playwright')
      await page.getByTestId('author').fill('Napoleon')
      await page.getByTestId('url').fill('http://example')
      await page.getByTestId('likes').fill('404')

      await page.getByRole('button', { name: 'Save' }).click()

      const notificationDiv = await page.locator('.notification')
      await expect(notificationDiv).toContainText('Blog by playwright')
      await expect(page.getByText('No blogs')).not.toBeVisible()
      // await expect(page.getByText('Blog by playwright')).toBeVisible()
    })

    // describe('When blog exists', () => {
    //   beforeEach(async ({ page }) => {
    //     await page.getByRole('button', { name: 'new blog' }).click()
      
    //     await page.getByTestId('title').fill('Initial blog')
    //     await page.getByTestId('author').fill('playwright')
    //     await page.getByTestId('url').fill('http://example')
    //     await page.getByTestId('likes').fill('404')

    //     await page.getByRole('button', { name: 'Save' }).click()
    //   })

    //   test('Blog can be removed', async ({ page }) => {
    //     await page.getByRole('button', { name: 'remove' }).click()
    //     await page.keyboard.press('Enter')
    //     await expect(page.getByText('No blogs')).toBeVisible()
    //   })
    // })
  })
})
