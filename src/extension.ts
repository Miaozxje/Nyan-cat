'use strict'

import * as vscode from 'vscode'
import * as fs from 'fs'
import { dirname, normalize } from 'path'

export async function activate(context: vscode.ExtensionContext) {
	const barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
	barItem.text = 'Nyan Cat'
	barItem.tooltip = 'Nyan Cat'
	barItem.show()

	const htmlDirPath = normalize(`${dirname(require.main.filename)}/vs/code/electron-sandbox/workbench`)
	const htmlFilePath = normalize(`${htmlDirPath}/workbench.html`)
	const htmlBackupPath = normalize(`${htmlDirPath}/index-nyan-cat-backup.html`)

	// backup index.html
	// backup()

	// // inject js, add unsafe-inline csp
	// injectScript()

	// // inject configuration
	// injectConfiguration()

	// manual inject configuration command
	let refreshCMD = vscode.commands.registerCommand('nyan-cat.NyanCatRefresh', () => {
		injectConfiguration()
		vscode.window
			.showInformationMessage('Nyan Cat: refresh successful, reload Window to take effect.', 'Reload Window')
			.then(msg => {
				msg === 'Reload Window' && vscode.commands.executeCommand('workbench.action.reloadWindow')
			})
	})

	// uninstall command
	let uninstallCMD = vscode.commands.registerCommand('nyan-cat.NyanCatUninstall', () => {
		prepareUninstall()
		vscode.window.showInformationMessage('Ready to uninstall Nyan Cat completed!')
	})

	// reload command
	let reloadCMD = vscode.commands.registerCommand('nyan-cat.NyanCatReload', () => {
		try {
			fs.statSync(htmlBackupPath)
		} catch (err) {
			if (err) {
				return
			}
		}
		prepareUninstall()
		backup()
		injectScript()
		injectConfiguration()
		vscode.window
			.showInformationMessage('Nyan Cat: reload successful, reload Window to take effect.', 'Reload Window')
			.then(msg => {
				msg === 'Reload Window' && vscode.commands.executeCommand('workbench.action.reloadWindow')
			})
	})

	context.subscriptions.push(refreshCMD)
	context.subscriptions.push(uninstallCMD)
	context.subscriptions.push(reloadCMD)

	function backup() {
		try {
			fs.statSync(htmlBackupPath)
		} catch (err) {
			if (err) {
				fs.writeFileSync(htmlBackupPath, fs.readFileSync(htmlFilePath))
			}
		}
	}

	function injectScript() {
		let htmlFileContent = fs.readFileSync(htmlFilePath, 'utf-8')
		if (!htmlFileContent.includes('nyan-cat.js')) {
			import('file-url').then(res => {
				const inject = `<script src="${res.default(__dirname + '/nyan-cat.js')}"></script>`
				htmlFileContent = htmlFileContent.replace('</html>', `${inject}\n</html>`)
				htmlFileContent = htmlFileContent.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
				fs.writeFileSync(htmlFilePath, htmlFileContent, 'utf-8')
			})
		}
	}

	function injectConfiguration() {
		const config = vscode.workspace.getConfiguration('NyanCat')
		config.update('backgroundColor', 'black')
		const inject = `<script id="NyanCatConfiguration">window.NyanCatConfiguration = ${JSON.stringify(
			config
		)}</script>`
		let htmlFileContent = fs.readFileSync(htmlFilePath, 'utf-8')
		htmlFileContent = htmlFileContent.replace(/\t?<script.*NyanCatConfiguration.*script>\n?/g, '')
		htmlFileContent = htmlFileContent.replace('</body>', `${inject}\n</body>`)
		fs.writeFileSync(htmlFilePath, htmlFileContent, 'utf-8')
	}

	function prepareUninstall() {
		fs.unlinkSync(htmlFilePath)
		fs.renameSync(htmlBackupPath, htmlFilePath)
	}
}

export function deactivate() {}
