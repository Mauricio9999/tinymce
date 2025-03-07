import { Waiter } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { TinyHooks } from '@ephox/wrap-mcagar';
import { assert } from 'chai';

import Editor from 'tinymce/core/api/Editor';

describe('browser.tinymce.core.EditableRootTest', () => {
  const assertContentEditableState = (editor: Editor, expectedState: boolean, message?: string) => {
    assert.equal(editor.getBody().isContentEditable, expectedState, message);
  };

  const assertRootEditableState = (editor: Editor, expectedState: boolean) => {
    assert.equal(editor.hasEditableRoot(), expectedState);
    assertContentEditableState(editor, expectedState);
  };

  context('editable_root: false', () => {
    let initialContentEditableState = '';

    const hook = TinyHooks.bddSetupLight<Editor>({
      base_url: '/project/tinymce/js/tinymce',
      editable_root: false,
      setup: (editor: Editor) => {
        editor.on('PreInit', () => {
          initialContentEditableState = editor.getBody().contentEditable;
        });
      }
    }, [], true);

    it('TINY-9839: Should not have an editable root state or editable body', () => {
      assertRootEditableState(hook.editor(), false);
      assert.equal(initialContentEditableState, 'inherit', 'Should not be editable early in the init process');
    });
  });

  context('editable_root: default', () => {
    const hook = TinyHooks.bddSetupLight<Editor>({
      base_url: '/project/tinymce/js/tinymce'
    }, [], true);

    it('TINY-9839: Should have an editable root state and editable body', () => {
      assertRootEditableState(hook.editor(), true);
    });

    it('TINY-9839: Should be able to toggle editable root state and track the state', () => {
      const editor = hook.editor();
      const states: boolean[] = [];

      editor.on('EditableRootStateChange', (e) => {
        states.push(e.state);
      });

      editor.setEditableRoot(false);
      assertRootEditableState(hook.editor(), false);

      // Setting false when it's false should not dispatch an event
      editor.setEditableRoot(false);

      editor.setEditableRoot(true);
      assertRootEditableState(hook.editor(), true);

      // Setting true when it's true should not dispatch an event
      editor.setEditableRoot(true);

      assert.deepEqual(states, [ false, true ]);
    });

    it('TINY-9839: Should be unaffected by readonly mode state changes', () => {
      const editor = hook.editor();

      editor.mode.set('readonly');
      assert.isTrue(editor.hasEditableRoot());
      assertContentEditableState(editor, true);

      editor.mode.set('design');
      assert.isTrue(editor.hasEditableRoot());
      assertContentEditableState(editor, true);

      editor.setEditableRoot(false);

      editor.mode.set('readonly');
      assert.isFalse(editor.hasEditableRoot());
      assertContentEditableState(editor, false);

      editor.mode.set('design');
      assert.isFalse(editor.hasEditableRoot());
      assertContentEditableState(editor, false);

      editor.mode.set('readonly');
      editor.setEditableRoot(true);

      assert.isTrue(editor.hasEditableRoot());
      assertContentEditableState(editor, true);
      editor.mode.set('design');
    });

    it('TINY-11488: Editor editable state should not be impacted by disabled mode toggling', async () => {
      const editor = hook.editor();

      editor.options.set('disabled', true);
      assert.isTrue(editor.hasEditableRoot(), 'Editable root should be present when disabled');
      await Waiter.pTryUntil('Wait for editor to be disabled', () => assertContentEditableState(editor, false, 'Content should not be editable when disabled'));

      editor.options.set('disabled', false);
      assert.isTrue(editor.hasEditableRoot(), 'Editable root should remain when re-enabled');
      await Waiter.pTryUntil('Wait for editor to be enabled', () => assertContentEditableState(editor, true, 'Content should be editable when re-enabled'));

      editor.setEditableRoot(false);

      editor.options.set('disabled', true);
      assert.isFalse(editor.hasEditableRoot(), 'Editable root should not be present after disabling');
      await Waiter.pTryUntil('Wait for editor to be disabled', () => assertContentEditableState(editor, false, 'Content should not be editable when disabled with no editable root'));

      editor.options.set('disabled', false);
      assert.isFalse(editor.hasEditableRoot(), 'Editable root should remain absent when re-enabled');
      await Waiter.pTryUntil('Wait for editor to be enabled', () => assertContentEditableState(editor, false, 'Content should not be editable when re-enabled with no editable root'));

      editor.options.set('disabled', true);
      editor.setEditableRoot(true);

      assert.isTrue(editor.hasEditableRoot(), 'Editable root should be restored');
      assertContentEditableState(editor, false, 'Content should remain non-editable when disabled with editable root');
    });
  });
});

