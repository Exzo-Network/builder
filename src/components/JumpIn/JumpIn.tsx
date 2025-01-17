import * as React from 'react'
import { Props } from './JumpIn.types'
import { getSelection, getCenter, getExplorerURL as getLandURL } from 'modules/land/utils'
import { getExplorerURL as getCollectionURL } from 'modules/collection/utils'
import './JumpIn.css'

export default class JumpIn extends React.PureComponent<Props> {
  render() {
    const { size = 'medium', land, collection, items } = this.props

    let url = ''
    if (items) {
      url = getCollectionURL({ item_ids: items.map(item => item.id) })
    } else if (collection) {
      url = getCollectionURL({ collection })
    } else if (land) {
      const selection = getSelection(land)
      const [x, y] = getCenter(selection)
      url = getLandURL(x, y)
    } else {
      throw new Error('You need to supply at least one of the available props')
    }

    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a className={`JumpIn ${size}`} target="_blank" rel="noopener noreferrer" href={url} />
  }
}
