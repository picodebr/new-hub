/**
 * Tipagem para os recursos da biblioteca de atores.
 */
export interface LibrarySprite {
    name: string;
    url: string;
    costumes?: { name: string; url: string }[];
    sounds?: { name: string; url: string; format: 'wav' | 'mp3' }[];
}

// NOTA: O array 'spriteLibrary' foi movido para 'public/mock_api/characters.json'
// para simular um banco de dados real e facilitar a integração com S3.
