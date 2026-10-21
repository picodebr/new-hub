import { useState } from 'react';

import { IProjectFormProps } from './interfaces';
import { Content, BottomContent } from './styles';
import { TextInput } from '@/components/Inputs/Text';
import { SelectInput } from '@/components/Inputs/Select';
import { RadioInput } from '@/components/Inputs/RadioInput';

export const Project: React.FC<IProjectFormProps> = ({
  name,
  privateProject,
  setName,
  setPrivate,
  onChangeFolder,
  folders = [],
  folder,
  allowFolderCreation = true,
  currentFolderId = '',
}) => {
  const [opened, setOpened] = useState(false);

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const initialValue = currentFolder ? [{ label: currentFolder.name, value: currentFolder.id }] : [];

  return (
    <Content data-select-opened={opened}>
      <TextInput label="Nome" value={name.value} error={name.error} onInputChange={setName} />
      <BottomContent>
        {!folder && (
          <SelectInput
            instanceId={1}
            options={folders.map((f) => ({ label: f.name, value: f.id }))}
            initialValue={initialValue}
            title=""
            onSelectChange={(e) => onChangeFolder && onChangeFolder(e[0])}
            placeholder="Selecione uma pasta"
            isCreatable={allowFolderCreation}
            onMenuOpen={() => setOpened(true)}
            onMenuClose={() => setOpened(false)}
          />
        )}
        <RadioInput
          title=""
          options={[
            { label: 'Público', value: 'false' },
            { label: 'Privado', value: 'true' },
          ]}
          initialValue={String(privateProject)}
          onInputChange={() => setPrivate(!privateProject)}
          isHorizontal={!!folder}
        />
      </BottomContent>
    </Content>
  );
};
