import * as React from 'react'
import { Link } from 'react-router-dom'
import { env } from 'decentraland-commons'
import { Section, Row, Dropdown, Narrow, Column, Header, Button, Icon, Popup, Radio, CheckboxProps } from 'decentraland-ui'
import { ContractName, getContract } from 'decentraland-transactions'
import { t, T } from 'decentraland-dapps/dist/modules/translation/utils'
import { Authorization, AuthorizationType } from 'decentraland-dapps/dist/modules/authorization/types'
import { hasAuthorization } from 'decentraland-dapps/dist/modules/authorization/utils'
import { locations } from 'routing/locations'
import { canMintCollectionItems, isOnSale, isOwner } from 'modules/collection/utils'
import { isComplete } from 'modules/item/utils'
import LoggedInDetailPage from 'components/LoggedInDetailPage'
import ConfirmDelete from 'components/ConfirmDelete'
import Notice from 'components/Notice'
import NotFound from 'components/NotFound'
import BuilderIcon from 'components/Icon'
import Back from 'components/Back'
import { AuthorizationModal } from 'components/AuthorizationModal'
import CollectionItem from './CollectionItem'
import { Props, State } from './CollectionDetailPage.types'
import './CollectionDetailPage.css'

const STORAGE_KEY = 'dcl-collection-notice'

export default class CollectionDetailPage extends React.PureComponent<Props, State> {
  state = { isAuthorizationModalOpen: false }

  handleUpdateManagers = () => {
    const { collection, onOpenModal } = this.props
    onOpenModal('CollectionManagersModal', { collectionId: collection!.id })
  }

  handleMintItems = () => {
    const { collection, onOpenModal } = this.props
    onOpenModal('MintItemsModal', { collectionId: collection!.id })
  }

  handleNewItem = () => {
    const { collection, onOpenModal } = this.props
    onOpenModal('CreateItemModal', { collectionId: collection!.id })
  }

  handleDeleteItem = () => {
    const { collection, onDelete } = this.props
    onDelete(collection!)
  }

  handlePublish = () => {
    const { authorizations, collection, onOpenModal } = this.props
    let isAuthorizationModalOpen = false

    if (hasAuthorization(authorizations, this.getAuthorization())) {
      onOpenModal('PublishCollectionModal', { collectionId: collection!.id })
    } else {
      isAuthorizationModalOpen = true
    }
    this.setState({ isAuthorizationModalOpen })
  }

  handleEditName = () => {
    const { collection, onOpenModal } = this.props
    if (collection && !collection.isPublished) {
      onOpenModal('EditCollectionNameModal', { collection })
    }
  }

  handleOnSaleChange = (_event: React.FormEvent<HTMLInputElement>, checkboxProps: CheckboxProps) => {
    const { collection, onOpenModal } = this.props
    const { checked } = checkboxProps
    if (collection && checked !== undefined) {
      onOpenModal('SellCollectionModal', { collectionId: collection.id, isOnSale: checked })
    }
  }

  getAuthorization(): Authorization {
    const { wallet } = this.props
    const chainId = wallet.networks.MATIC.chainId
    const tokenAddress = getContract(ContractName.MANAToken, chainId).address
    const authorizedAddress = getContract(ContractName.CollectionManager, chainId).address
    return {
      type: AuthorizationType.ALLOWANCE,
      address: wallet.address,
      tokenAddress,
      authorizedAddress,
      chainId
    }
  }

  canPublish() {
    const { items } = this.props
    return env.get('REACT_APP_FF_WEARABLES_PUBLISH') && this.hasItems() && items.every(isComplete)
  }

  hasItems() {
    const { items } = this.props
    return items.length > 0
  }

  renderPage() {
    const { wallet, items, isOnSaleLoading, onOpenModal, onNavigate } = this.props
    const collection = this.props.collection!

    const canMint = canMintCollectionItems(collection, wallet.address)

    return (
      <>
        <Section className={collection.isPublished ? 'is-published' : ''}>
          <Row>
            <Back absolute onClick={() => onNavigate(locations.collections())} />
            <Narrow>
              <Row>
                <Column className="header-column">
                  <Row className="header-row" onClick={this.handleEditName}>
                    <Header size="huge" className="name">
                      {collection.name}
                    </Header>
                    <BuilderIcon name="edit" className="edit-collection-name" />
                  </Row>
                </Column>
                <Column align="right" shrink={false} grow={false}>
                  <Row className="actions">
                    {isOwner(collection, wallet.address) ? (
                      <>
                        {collection.isPublished ? (
                          <>
                            <Popup
                              content={
                                isOnSaleLoading
                                  ? t('global.loading')
                                  : isOnSale(collection)
                                  ? t('collection_detail_page.unset_on_sale_popup')
                                  : t('collection_detail_page.set_on_sale_popup')
                              }
                              position="top center"
                              trigger={
                                <Radio
                                  toggle
                                  className="on-sale"
                                  checked={isOnSale(collection)}
                                  onChange={this.handleOnSaleChange}
                                  label={t('collection_detail_page.on_sale')}
                                  disabled={isOnSaleLoading}
                                />
                              }
                              hideOnScroll={true}
                              on="hover"
                              inverted
                              flowing
                            />

                            <Button basic className="action-button" disabled={!canMint} onClick={this.handleMintItems}>
                              <Icon name="paper plane" />
                              <span className="text">{t('collection_detail_page.mint_items')}</span>
                            </Button>
                          </>
                        ) : (
                          <Button basic className="action-button" onClick={this.handleNewItem}>
                            <Icon name="plus" />
                            <span className="text">{t('collection_detail_page.new_item')}</span>
                          </Button>
                        )}
                      </>
                    ) : null}

                    {isOwner(collection, wallet.address) ? (
                      <Dropdown
                        trigger={
                          <Button basic>
                            <Icon name="ellipsis horizontal" />
                          </Button>
                        }
                        inline
                        direction="left"
                      >
                        <Dropdown.Menu>
                          {collection.isPublished ? (
                            <Dropdown.Item text={t('collection_detail_page.managers')} onClick={this.handleUpdateManagers} />
                          ) : (
                            <>
                              <Dropdown.Item
                                text={t('collection_detail_page.add_existing_item')}
                                onClick={() => onOpenModal('AddExistingItemModal', { collectionId: collection!.id })}
                              />
                              <ConfirmDelete
                                name={collection.name}
                                onDelete={this.handleDeleteItem}
                                trigger={<Dropdown.Item text={t('global.delete')} />}
                              />
                            </>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    ) : null}

                    {collection.isPublished ? (
                      collection.isApproved ? (
                        <Button secondary compact disabled={true}>
                          {t('global.published')}
                        </Button>
                      ) : (
                        <Popup
                          content={t('collection_detail_page.cant_mint')}
                          position="top center"
                          trigger={
                            <div className="popup-button">
                              <Button secondary compact disabled={true}>
                                {t('collection_detail_page.under_review')}
                              </Button>
                            </div>
                          }
                          hideOnScroll={true}
                          on="hover"
                          inverted
                          flowing
                        />
                      )
                    ) : (
                      <Button primary compact disabled={!this.canPublish()} onClick={this.handlePublish}>
                        {t('collection_detail_page.publish')}
                      </Button>
                    )}
                  </Row>
                </Column>
              </Row>
            </Narrow>
          </Row>
        </Section>
        <Narrow>
          <Notice storageKey={STORAGE_KEY}>
            <T
              id="collection_detail_page.notice"
              values={{
                editor_link: (
                  <Link to={locations.itemEditor({ collectionId: collection.id, itemId: items.length > 0 ? items[0].id : undefined })}>
                    {t('collection_detail_page.click_here')}
                  </Link>
                )
              }}
            />
          </Notice>

          {this.hasItems() ? (
            <div className="collection-items">
              {items.map(item => (
                <CollectionItem key={item.id} collection={collection} item={item} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="sparkles" />
              <div>
                {t('collection_detail_page.start_adding_items')}
                <br />
                {t('collection_detail_page.cant_remove')}
              </div>
            </div>
          )}
        </Narrow>
        {this.renderAuthorizationModal()}
      </>
    )
  }

  handleCloseAuthorizationModal = () => {
    this.setState({ isAuthorizationModalOpen: false })
  }

  renderAuthorizationModal() {
    const { isAuthorizationModalOpen } = this.state

    return (
      <AuthorizationModal
        open={isAuthorizationModalOpen}
        authorization={this.getAuthorization()}
        onProceed={this.handlePublish}
        onCancel={this.handleCloseAuthorizationModal}
      />
    )
  }

  render() {
    const { isLoading, collection } = this.props
    return (
      <LoggedInDetailPage className="CollectionDetailPage" hasNavigation={false} isLoading={isLoading}>
        {collection === null ? <NotFound /> : this.renderPage()}
      </LoggedInDetailPage>
    )
  }
}
