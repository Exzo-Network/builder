import { WearableCategory } from '@dcl/schemas'
import { ItemRarity } from 'modules/item/types'

export type Props = {
  rarity: ItemRarity
  category: WearableCategory
  size: 'medium' | 'small'
  withTooltip: boolean
  className?: string
}

export type OwnProps = Pick<Props, 'rarity' | 'category'>
