'use client'

import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function ProdutosTab() {
  const {
    isMaster,
    products,
    newProductName,
    setNewProductName,
    handleCreateProduct,
    handleProductFieldChange,
    handleRemoveProduct,
    CLIENT_STATUS_OPTIONS,
  } = useDashboard()

  return (
          <section className="clients-layout">
            <div className="management-header-row">
              <div className="management-header-copy">
                <h2>Gestão de Produtos</h2>
                <p>Cadastre os produtos da operação em uma base própria e vincule cada cliente a uma oferta padronizada.</p>
              </div>
            </div>

            <div className="client-create-grid">
              <form className="glass-panel client-create-bar management-action-card" onSubmit={handleCreateProduct}>
                <div>
                  <span className="management-card-kicker">New product</span>
                  <h3>Novo produto</h3>
                  <p>Crie um produto que poderá ser usado em toda a base de clientes.</p>
                </div>
                <div className="client-create-inline">
                  <input type="text" value={newProductName} onChange={(event) => setNewProductName(event.target.value)} placeholder="Ex.: Assessoria, Tráfego, Full service..." disabled={!isMaster} />
                  <button type="submit" className="btn btn-primary" disabled={!isMaster}>Adicionar produto</button>
                </div>
              </form>
            </div>

            <div className="clients-grid clients-grid-single">
              <div className="glass-panel users-toolbar-card management-directory-card">
                <div className="user-picker-head">
                  <div>
                    <span className="management-card-kicker">Product registry</span>
                    <h3>Produtos cadastrados</h3>
                    <p>Use essa base para padronizar o preenchimento dos clientes e evitar produto digitado diferente em cada conta.</p>
                  </div>
                </div>

                <div className="client-products-grid">
                  {products.map((product) => (
                    <div key={product.id} className="glass-item client-product-card">
                      <div className="client-form-grid">
                        <div className="input-group">
                          <label>Nome</label>
                          <input type="text" value={product.name || ''} onChange={(event) => handleProductFieldChange(product.id, 'name', event.target.value)} placeholder="Nome do produto" />
                        </div>
                        <div className="input-group">
                          <label>Status</label>
                          <select value={product.status || 'Ativo'} onChange={(event) => handleProductFieldChange(product.id, 'status', event.target.value)}>
                            {CLIENT_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Descrição</label>
                          <input type="text" value={product.description || ''} onChange={(event) => handleProductFieldChange(product.id, 'description', event.target.value)} placeholder="Resumo rápido do produto" />
                        </div>
                      </div>
                      {isMaster && (
                        <div className="client-registry-actions">
                          <button type="button" className="btn btn-secondary" onClick={() => handleRemoveProduct(product.id)}>
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!products.length && (
                  <div className="empty-panel glass-item users-empty-state compact-empty-state">
                    <h3>Nenhum produto cadastrado</h3>
                    <p>Crie o primeiro produto para começar a vincular os clientes por oferta.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
  )
}
