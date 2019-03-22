import {
  NamespaceHttp,
  NamespaceId
} from 'nem2-sdk'

const namespaceHttp = new NamespaceHttp('http://localhost:3000')
const namespaceId = new NamespaceId('cat.currency')

namespaceHttp
.getLinkedMosaicId(namespaceId)
.subscribe((mosaicId) => {
  console.log('MosaicId', mosaicId)
})
