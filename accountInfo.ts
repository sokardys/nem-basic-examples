import {
  AccountHttp,
  Address,
  MosaicHttp,
  MosaicService
} from 'nem2-sdk'
import { mergeMap } from 'rxjs/operators'

// 00 - Config
const NODE_URL = 'http://localhost:3000'
const OWNER_ADDRESS = 'SDZRF44SCXUDUYTLCOZMXRLVA6DEYPI5QC7KVTE6'

const accountHttp = new AccountHttp(NODE_URL)
const mosaicHttp = new MosaicHttp(NODE_URL)
const mosaicService = new MosaicService(accountHttp, mosaicHttp)

const address = Address.createFromRawAddress(OWNER_ADDRESS)

mosaicService
  .mosaicsAmountViewFromAddress(address)
  .pipe(
    mergeMap((_) => _)
  )
  .subscribe(mosaic => {
    console.log('mosaic', mosaic)
    console.log('You have', mosaic.relativeAmount(), mosaic.fullName())
  }, err => console.error(err))
