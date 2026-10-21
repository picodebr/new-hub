import { SerialConnection } from './SerialConnection';
import { stk } from './stkCommands';

type LoopThroughPageCallback = (
  params: ILoopThroughCallbackParams,
) => Promise<void>;

interface ILoopThroughCallbackParams {
  writtenCode: number[];
  pageAddress: number;
  page: number;
  pages: number;
}

type WaitForDeviceSync = () => Promise<void>;

const PAGE_SIZE = 0x80; // 128 bytes
const MEMORY_CODE_HEX = 'F'.charCodeAt(0);

const formatPageAddressToSend = (address: number) => {
  const msb = Math.floor(address / 256);
  const lsb = address % 256;

  return [lsb, msb]; // lsb first
};

const formatCodeLength = (length: number) => {
  const msb = Math.floor(length / 256);
  const lsb = length % 256;

  return [msb, lsb];
};

const writeCodePage = async (
  serial: SerialConnection,
  code: number[],
  pageAddress: number,
  waitForDeviceSync: WaitForDeviceSync,
) => {
  await serial.writeSTKCommands(
    stk.LOAD_ADDRESS,
    ...formatPageAddressToSend(pageAddress),
  );
  await waitForDeviceSync();

  await serial.writeSTKCommands(
    stk.PROG_PAGE,
    ...formatCodeLength(code.length),
    MEMORY_CODE_HEX,
    ...code,
  );
  await waitForDeviceSync();
};

const loopThroughCodePages = async (
  code: number[],
  callback: LoopThroughPageCallback,
) => {
  const pages = Math.ceil(code.length / PAGE_SIZE);

  for (let page = 0; page < pages; page += 1) {
    const codeIndex = page * PAGE_SIZE;
    const writtenCode = code.slice(codeIndex, codeIndex + PAGE_SIZE);
    const pageAddress = codeIndex / 2; // 2 bytes each memory address

    await callback({
      writtenCode,
      pageAddress,
      page,
      pages,
    });
  }
};

export const writeSerialCode = async (
  serial: SerialConnection,
  code: number[],
  waitForDeviceSync: WaitForDeviceSync,
) => {
  
  await serial.writeSTKCommands(stk.ENTER_PROGMODE);
  await waitForDeviceSync();

  await loopThroughCodePages(code, async ({ writtenCode, pageAddress }) => {
    await writeCodePage(serial, writtenCode, pageAddress, waitForDeviceSync);
  });

  await serial.writeSTKCommands(stk.LEAVE_PROGMODE);
  await waitForDeviceSync();
};
