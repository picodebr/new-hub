/**
 * BlocklyModals — Container de todos os modais do BlocklyWorkspace.
 *
 * Centraliza: VariableModal, VariableDeleteModal, ProcedureModal, ExtensionModal, MLExtensionModal
 */

'use client';

import React from 'react';
import * as Blockly from 'blockly/core';
import ExtensionModal from '../modals/ExtensionModal';
import { MLExtensionModal } from '../ml/MLExtensionModal';

// Lazy load modals
const VariableModal = React.lazy(() => import('../modals/VariableModal'));
const VariableDeleteModal = React.lazy(() => import('../modals/VariableDeleteModal'));
const ListModal = React.lazy(() => import('../modals/ListModal'));
const ListDeleteModal = React.lazy(() => import('../modals/ListDeleteModal'));
const ProcedureModal = React.lazy(() => import('../modals/ProcedureModal'));
const BroadcastModal = React.lazy(() => import('../modals/BroadcastModal'));

export interface BlocklyModalsProps {
  workspace: Blockly.WorkspaceSvg | null;
  isUploadMode: boolean;
  // Variable Modal
  isVarModalOpen: boolean;
  setIsVarModalOpen: (open: boolean) => void;
  // Variable Delete Modal
  isVarDeleteModalOpen: boolean;
  setIsVarDeleteModalOpen: (open: boolean) => void;
  preselectedVar: string | null;
  setPreselectedVar: (v: string | null) => void;
  // List Modal
  isListModalOpen: boolean;
  setIsListModalOpen: (open: boolean) => void;
  // List Delete Modal
  isListDeleteModalOpen: boolean;
  setIsListDeleteModalOpen: (open: boolean) => void;
  // Procedure Modal
  isProcModalOpen: boolean;
  setIsProcModalOpen: (open: boolean) => void;
  // Broadcast Modal
  isBroadcastModalOpen: boolean;
  setIsBroadcastModalOpen: (open: boolean) => void;
  // Extension Modal
  isExtensionModalOpen: boolean;
  setIsExtensionModalOpen: (open: boolean) => void;
  activeExtensions: string[];
  setActiveExtensions: React.Dispatch<React.SetStateAction<string[]>>;
  // ML Modal
  isMLModalOpen: boolean;
  setIsMLModalOpen: (open: boolean) => void;
}

export const BlocklyModals: React.FC<BlocklyModalsProps> = ({
  workspace,
  isUploadMode,
  isVarModalOpen,
  setIsVarModalOpen,
  isVarDeleteModalOpen,
  setIsVarDeleteModalOpen,
  preselectedVar,
  setPreselectedVar,
  isListModalOpen,
  setIsListModalOpen,
  isListDeleteModalOpen,
  setIsListDeleteModalOpen,
  isProcModalOpen,
  setIsProcModalOpen,
  isBroadcastModalOpen,
  setIsBroadcastModalOpen,
  isExtensionModalOpen,
  setIsExtensionModalOpen,
  activeExtensions,
  setActiveExtensions,
  isMLModalOpen,
  setIsMLModalOpen,
}) => {
  return (
    <React.Suspense fallback={null}>
      {workspace && (
        <>
          <VariableModal isOpen={isVarModalOpen} onClose={() => setIsVarModalOpen(false)} workspace={workspace} isUploadMode={isUploadMode} />
          <VariableDeleteModal
            isOpen={isVarDeleteModalOpen}
            onClose={() => {
              setIsVarDeleteModalOpen(false);
              setPreselectedVar(null);
            }}
            workspace={workspace}
            isUploadMode={isUploadMode}
            initialSelection={preselectedVar}
          />
          <ListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} workspace={workspace} isUploadMode={isUploadMode} />
          <ListDeleteModal
            isOpen={isListDeleteModalOpen}
            onClose={() => setIsListDeleteModalOpen(false)}
            workspace={workspace}
            isUploadMode={isUploadMode}
          />
          <ProcedureModal isOpen={isProcModalOpen} onClose={() => setIsProcModalOpen(false)} workspace={workspace} />
          <BroadcastModal isOpen={isBroadcastModalOpen} onClose={() => setIsBroadcastModalOpen(false)} workspace={workspace} />
        </>
      )}
      {isExtensionModalOpen && (
        <ExtensionModal
          isOpen={isExtensionModalOpen}
          onClose={() => setIsExtensionModalOpen(false)}
          mode={isUploadMode ? 'upload' : 'stage'}
          onSelectExtension={(extId) => {
            if (!activeExtensions.includes(extId)) {
              setActiveExtensions((prev) => [...prev, extId]);
            }
            // If ML extension selected, open model selector
            if (extId === 'ia') {
              setIsMLModalOpen(true);
            }
            setIsExtensionModalOpen(false);
          }}
        />
      )}
      <MLExtensionModal isOpen={isMLModalOpen} onClose={() => setIsMLModalOpen(false)} mode={isUploadMode ? 'upload' : 'stage'} />
    </React.Suspense>
  );
};
