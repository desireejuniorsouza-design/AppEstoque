// src/pages/EstoqueGeral.jsx
import React, { useState, useEffect } from 'react';
import './EstoqueGeral.css';

export default function EstoqueGeral() {
    const [estoque, setEstoque] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    // Novo estado para o item que está sendo editado
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        fetchEstoque();
    }, [searchTerm, sortBy, sortDirection]);

    const fetchEstoque = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `http://localhost:3001/api/estoque?searchTerm=${searchTerm}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Falha ao carregar dados do estoque.');
            }
            const data = await response.json();
            setEstoque(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                const response = await fetch(`http://localhost:3001/api/estoque/${id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error('Falha ao excluir o registro.');
                }
                setEstoque(estoque.filter(item => item.id !== id));
                alert('Registro excluído com sucesso!');
            } catch (err) {
                alert(err.message);
            }
        }
    };
    
    // Novo: Função para iniciar a edição
    const handleEdit = (item) => {
        setEditingItem(item);
    };

    // Novo: Função para lidar com o envio do formulário de edição
    const handleUpdate = async (e) => {
        e.preventDefault(); // Impede o recarregamento da página
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/estoque/${editingItem.id}`, {
                method: 'PUT', // Usamos o método PUT para atualizar
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editingItem),
            });

            if (!response.ok) {
                throw new Error('Falha ao atualizar o registro.');
            }

            const updatedItem = await response.json();
            
            // Atualiza o item na lista localmente
            setEstoque(estoque.map(item => item.id === updatedItem.id ? updatedItem : item));
            
            // Limpa o estado de edição
            setEditingItem(null); 
            
            alert('Registro atualizado com sucesso!');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        alert('Funcionalidade de exportar para Excel em desenvolvimento.');
    };

    // JSX do componente
    return (
        <div className="container">
            <h1 className="title">Gestão de Estoque 📊</h1>
            
            <div className="controls-container">
                <input
                    type="text"
                    placeholder="Buscar por lote, produtor, espécie..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />
                <button onClick={handleExportExcel} className="export-button">
                    Exportar para Excel
                </button>
            </div>

            {loading && <p>Carregando dados...</p>}
            {error && <p className="error-message">Erro: {error}</p>}

            {/* Novo: Formulário de Edição */}
            {editingItem && (
                <div className="edit-form-container">
                    <h3>Editar Item</h3>
                    <form onSubmit={handleUpdate}>
                        {/* Você pode adicionar mais campos conforme a necessidade */}
                        <label>
                            Lote:
                            <input
                                type="text"
                                value={editingItem.lote}
                                onChange={(e) => setEditingItem({ ...editingItem, lote: e.target.value })}
                            />
                        </label>
                        <label>
                            Espécie:
                            <input
                                type="text"
                                value={editingItem.especie}
                                onChange={(e) => setEditingItem({ ...editingItem, especie: e.target.value })}
                            />
                        </label>
                        <label>
                            Quantidade:
                            <input
                                type="number"
                                value={editingItem.quantidade_palete}
                                onChange={(e) => setEditingItem({ ...editingItem, quantidade_palete: parseInt(e.target.value, 10) })}
                            />
                        </label>
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={() => setEditingItem(null)}>Cancelar</button>
                    </form>
                </div>
            )}
            
            {!loading && !error && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('lote')}>Lote</th>
                                <th onClick={() => handleSort('especie')}>Espécie</th>
                                <th onClick={() => handleSort('quantidade_palete')}>Qtd. Palete</th>
                                <th onClick={() => handleSort('validade')}>Validade</th>
                                <th onClick={() => handleSort('local_armazenado')}>Local</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estoque.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.lote}</td>
                                    <td>{item.especie}</td>
                                    <td>{item.quantidade_palete}</td>
                                    <td>{item.validade}</td>
                                    <td>{item.local_armazenado}</td>
                                    <td>
                                        <button onClick={() => handleDelete(item.id)} className="delete-button">Excluir</button>
                                        {/* Atualizado: Botão de editar chama a nova função */}
                                        <button onClick={() => handleEdit(item)} className="edit-button">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}