import {
    Account,
    AggregateTransaction,
    CosignatureSignedTransaction,
    CosignatureTransaction,
    InnerTransaction,
    Listener,
    MosaicId,
    NetworkType,
    PublicAccount,
    TransactionHttp,
    TransactionType,
    TransferTransaction,
    XEM
} from 'nem2-sdk'

import { filter, map, mergeMap } from 'rxjs/operators'

// 00 - Config
const NODE_URL = 'http://localhost:3000'

const CUSTOMER_ADDRESSES_PUBLIC_KEY = 'EFBF94F4B38CC1CA2EC0806EDB1A8EE83ADB87D9C1A92861DF89BC674CB01B91'
const TUTELLUS_PUBLIC_KEY = 'F170B393B219F0E635232E540B55F86982F542A9587ABF27BD992F71D456E681'
const VENDOR_PK = 'F170B393B219F0E635232E540B55F86982F542A9587ABF27BD992F71D456E681'

const MOSAIC_COURSE_HEXID = 'd754251fc06abbbf'
const COURSE_PRICE = 190

// 01 - Set up
const transactionHttp = new TransactionHttp(NODE_URL)
const listener = new Listener(NODE_URL)

const tutellusPublicAccount = PublicAccount.createFromPublicKey(TUTELLUS_PUBLIC_KEY, NetworkType.MIJIN_TEST)
const vendorAccount = Account.createFromPrivateKey(VENDOR_PK, NetworkType.MIJIN_TEST)

// 02 - Specify ticket price and mosaic
const coursePrice = XEM.createRelative(COURSE_PRICE)
// Todo: For this exercise, we'll fetch this using nem2-cli
const ticketId = new MosaicId(MOSAIC_COURSE_HEXID)

const cosignAggregateBondedTransaction = (transaction: AggregateTransaction, account: Account): CosignatureSignedTransaction => {
  const cosignatureTransaction = CosignatureTransaction.create(transaction)
  return account.signCosignatureTransaction(cosignatureTransaction)
}

// 03 - Specify the off-chain logic checks
const isAggregateTransactionValid = (innerTransactions: InnerTransaction[]) => {

  let transferInnerTransactions = innerTransactions
        .filter(_ => _.type === TransactionType.TRANSFER) as TransferTransaction[]

  const customerToTutellusTx = transferInnerTransactions
        .filter(_ => _.recipient.equals(tutellusPublicAccount.address))[0]

  const customerToVendorTx = transferInnerTransactions
        .filter(_ => (_.recipient.equals(vendorAccount.address)) && _.mosaics.length > 0)[0]

  const exchangeToTicketVendorTx = transferInnerTransactions
        .filter(_ => _.recipient.equals(vendorAccount.address) && _.mosaics.length === 0)[0]

  const vendorToCustomer = transferInnerTransactions
        .filter(_ => _ !== customerToTutellusTx && _
            !== customerToVendorTx &&
            _ !== exchangeToTicketVendorTx)[0]

  const validTransactionsLength = ((innerTransactions
        .filter(_ => _.type === TransactionType.TRANSFER).length === 4) && (innerTransactions.length === 4))

  console.log('validTxLength: ' + validTransactionsLength)

  const validMosaicsLength = (customerToTutellusTx.mosaics.length === 1 &&
        customerToVendorTx.mosaics.length === 1
        && vendorToCustomer.mosaics.length === 1
        && exchangeToTicketVendorTx.mosaics.length === 0)

  console.log('validMosaicsLength: ' + validMosaicsLength)

  const validMosaics = (customerToTutellusTx.mosaics[0].id.toHex() === XEM.MOSAIC_ID.toHex() &&
        customerToVendorTx.mosaics[0].id.toHex() === XEM.MOSAIC_ID.toHex()
        && vendorToCustomer.mosaics[0].id.toHex() === ticketId.toHex())

  console.log('validMosaics: ' + validMosaics)

  const validExchangeRate = (customerToTutellusTx.mosaics[0].amount.compact()  ==
        customerToVendorTx.mosaics[0].amount.compact() * 0.10)

  console.log('validExchangeRate: ' + validExchangeRate)

  const validNumberOfTickets = (customerToVendorTx.mosaics[0].amount.compact() / coursePrice.amount.compact() ===
        vendorToCustomer.mosaics[0].amount.compact())

  console.log('validNumberOfTickets: ' + validNumberOfTickets)

  return (validTransactionsLength &&
        validMosaicsLength &&
        validMosaics &&
        validExchangeRate &&
        validNumberOfTickets)
}

// 04 - Handle signing and announcement of cosigning

listener.open()
.then(() => {
  listener
    .aggregateBondedAdded(vendorAccount.address)
    .pipe(
        filter((_) => !_.signedByAccount(vendorAccount.publicAccount)),
        filter((_) => (isAggregateTransactionValid(_.innerTransactions))),
        map(transaction => cosignAggregateBondedTransaction(transaction, vendorAccount)),
        mergeMap(cosignatureSignedTransaction => transactionHttp.announceAggregateBondedCosignature(cosignatureSignedTransaction))
    )
    .subscribe(announcedTransaction => console.log(announcedTransaction), err => console.error(err))
})
.catch((error) => console.error('** Error', error))
