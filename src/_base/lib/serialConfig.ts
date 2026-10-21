/**
 * Configurações, comandos e constantes do protocolo Serial (STK500).
 */
// ========================== SERIAL CONFIGURATION ==========================


export const uploadConfig = {
    BOOTLOADER_START_DELAY: 700,
    DEFAULT_BAUD_RATE: 115200, // Ajustar conforme necessidade (57600 para Nano Old Bootloader)
    PAGE_SIZE: 128,
};

export const STK = {
    OK: 0x10,
    FAILED: 0x11,
    UNKNOWN: 0x12,
    NODEVICE: 0x13,
    IN_SYNC: 0x14,
    NOSYNC: 0x15,
    ADC_CHANNEL_ERROR: 0x16,
    ADC_MEASURE_OK: 0x17,
    PWM_CHANNEL_ERROR: 0x18,
    PWM_ADJUST_OK: 0x19,
    CRC_EOP: 0x20, // Fim do Pacote (obrigatório)
    GET_SYNC: 0x30, // Handshake inicial
    GET_SIGN_ON: 0x31,
    SET_PARAMETER: 0x40,
    GET_PARAMETER: 0x41,
    SET_DEVICE: 0x42,
    SET_DEVICE_EXT: 0x45,
    ENTER_PROGMODE: 0x50, // Entrar no modo de programação
    LEAVE_PROGMODE: 0x51, // Sair do modo de programação (reboot)
    CHIP_ERASE: 0x52,
    CHECK_AUTOINC: 0x53,
    LOAD_ADDRESS: 0x55, // Definir endereço
    UNIVERSAL: 0x56,
    PROG_FLASH: 0x60,
    PROG_DATA: 0x61,
    PROG_FUSE: 0x62,
    PROG_LOCK: 0x63,
    PROG_PAGE: 0x64, // Escrever página de dados
    PROG_FUSE_EXT: 0x65,
    READ_FLASH: 0x70,
    READ_DATA: 0x71,
    READ_FUSE: 0x72,
    READ_LOCK: 0x73,
    READ_PAGE: 0x74,
    READ_SIGN: 0x75,
    READ_OSCCAL: 0x76,
    READ_FUSE_EXT: 0x77,
    READ_OSCCAL_EXT: 0x78,
    SW_MAJOR: 0x81,
    SW_MINOR: 0x82,
} as const;

