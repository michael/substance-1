import { isMatch } from '../util'
import { Command } from '.'

/*
  Usage in packages:

  ```js
  config.addCommand('heading1', SwitchTextTypeCommand, {
    spec: { type: 'heading', level: 1 }
  })
  ```
*/
class SwitchTextTypeCommand extends Command {

  getCommandState(params) {
    let doc = params.editorSession.getDocument()
    let sel = params.selection

    let newState = {
      disabled: false
    }

    if (sel.isPropertySelection()) {
      let path = sel.getPath()
      let node = doc.get(path[0])
      if (node && node.isText() && node.isBlock()) {
        newState.active = isMatch(node, this.config.spec)
        // When cursor is at beginning of a non-empty text block we signal
        // that we want the tool to appear contextually (e.g. in an overlay)
        let showInContext = false
        if (sel.start.offset === 0 && sel.end.offset === 0) {
          let content = doc.get(sel.getPath())
          if (content.length > 0) showInContext = true
        }
        newState.showInContext = showInContext
      } else {
        newState.disabled = true
      }
    } else {
      // TODO: Allow Container Selections too, to switch multiple paragraphs
      newState.disabled = true
    }

    return newState
  }

  /**
    Perform a switchTextType transformation based on the current selection
  */
  execute(params) {
    let surface = params.surface
    let editorSession = params.editorSession
    if (!surface) {
      console.warn('No focused surface. Stopping command execution.')
      return
    }
    editorSession.transaction((tx) => {
      return tx.switchTextType(this.config.spec)
    })
  }
}

export default SwitchTextTypeCommand
