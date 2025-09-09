// src/pages/EstoqueGeral.jsx
import React, { useState, useEffect } from 'react';
import './EstoqueGeral.css';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

// Registra os componentes necessários do Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function EstoqueGeral() {
    const [estoque, setEstoque] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleExportExcel = async () => {
        alert('Funcionalidade de exportar para Excel em desenvolvimento.');
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveEdit = async (updatedData) => {
        try {
            const response = await fetch(`http://localhost:3001/api/estoque/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao atualizar o registro.');
            }

            const updatedItem = await response.json();
            setEstoque(estoque.map(item => item.id === updatedItem.id ? updatedItem : item));
            
            closeModal();
            alert('Registro atualizado com sucesso!');
        } catch (err) {
            alert(err.message);
        }
    };

    // Lógica para dados do gráfico por Espécie (Gráfico de Barras)
    const especies = [...new Set(estoque.map(item => item.especie))];
    const dataGraficoEspecies = {
        labels: especies,
        datasets: [{
            label: 'Quantidade por Espécie',
            data: especies.map(especie => 
                estoque.filter(item => item.especie === especie)
                       .reduce((sum, current) => sum + current.quantidade_palete, 0)
            ),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    };
    const optionsGraficoEspecies = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Estoque por Espécie' },
        },
    };

    // Lógica para dados do gráfico por Local de Armazenamento (Gráfico de Pizza)
    const locais = [...new Set(estoque.map(item => item.local_armazenado))];
    const dataGraficoLocais = {
        labels: locais,
        datasets: [{
            label: 'Distribuição por Local',
            data: locais.map(local => 
                estoque.filter(item => item.local_armazenado === local)
                       .reduce((sum, current) => sum + current.quantidade_palete, 0)
            ),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
        }],
    };
    const optionsGraficoLocais = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Distribuição de Estoque por Local' },
        },
    };

    // Lógica para dados do gráfico por Produtor (Gráfico de Barras Horizontal)
    const produtores = [...new Set(estoque.map(item => item.produtor))];
    const dataGraficoProdutores = {
        labels: produtores,
        datasets: [{
            label: 'Quantidade por Produtor',
            data: produtores.map(produtor => 
                estoque.filter(item => item.produtor === produtor)
                       .reduce((sum, current) => sum + current.quantidade_palete, 0)
            ),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
        }],
    };
    const optionsGraficoProdutores = {
        indexAxis: 'y', // Define o eixo X como o de categoria (eixo de barras horizontais)
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Estoque por Produtor' },
        },
    };

    return (
        <div className="container">
            <h1 className="title">Gestão de Estoque 📊</h1>
            
            <div className="content-wrapper">
                {/* Container dos gráficos no lado esquerdo */}
                <div className="charts-container">
                    <div className="chart-card">
                        <Bar data={dataGraficoEspecies} options={optionsGraficoEspecies} />
                    </div>
                    <div className="chart-card">
                        <Pie data={dataGraficoLocais} options={optionsGraficoLocais} />
                    </div>
                    <div className="chart-card">
                        <Bar data={dataGraficoProdutores} options={optionsGraficoProdutores} />
                    </div>
                </div>

                {/* Conteúdo principal com a tabela no lado direito */}
                <div className="main-content">
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
                    
                    {!loading && !error && (
                        <div>
                            <div className="table-responsive">
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
                                                    <button onClick={() => handleEdit(item)} className="edit-button">Editar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && editingItem && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Editar Item de Estoque</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const updatedData = {
                                especie: e.target.especie.value,
                                categoria: e.target.categoria.value,
                                hibrido: e.target.hibrido.value,
                                peneira: e.target.peneira.value,
                                lote: e.target.lote.value,
                                safra: e.target.safra.value,
                                peso: parseFloat(e.target.peso.value) || 0,
                                produtor: e.target.produtor.value,
                                validade: e.target.validade.value,
                                tratamento: e.target.tratamento.value,
                                sacaria: e.target.sacaria.value,
                                quantidade_lastro: parseInt(e.target.quantidade_lastro.value) || 0,
                                quantidade_palete: parseInt(e.target.quantidade_palete.value) || 0,
                                total_lote: parseInt(e.target.total_lote.value) || 0,
                                local_armazenado: e.target.local_armazenado.value
                            };
                            handleSaveEdit(updatedData);
                        }}>
                            <div className="form-group">
                                <label>Lote:</label>
                                <input type="text" name="lote" defaultValue={editingItem.lote} />
                            </div>
                            <div className="form-group">
                                <label>Espécie:</label>
                                <input type="text" name="especie" defaultValue={editingItem.especie} />
                            </div>
                            <div className="form-group">
                                <label>Categoria:</label>
                                <input type="text" name="categoria" defaultValue={editingItem.categoria} />
                            </div>
                            <div className="form-group">
                                <label>Híbrido:</label>
                                <input type="text" name="hibrido" defaultValue={editingItem.hibrido} />
                            </div>
                            <div className="form-group">
                                <label>Peneira:</label>
                                <input type="text" name="peneira" defaultValue={editingItem.peneira} />
                            </div>
                            <div className="form-group">
                                <label>Safra:</label>
                                <input type="text" name="safra" defaultValue={editingItem.safra} />
                            </div>
                            <div className="form-group">
                                <label>Peso (kg):</label>
                                <input type="number" name="peso" step="0.01" defaultValue={editingItem.peso} />
                            </div>
                            <div className="form-group">
                                <label>Produtor:</label>
                                <input type="text" name="produtor" defaultValue={editingItem.produtor} />
                            </div>
                            <div className="form-group">
                                <label>Validade:</label>
                                <input type="date" name="validade" defaultValue={editingItem.validade} />
                            </div>
                            <div className="form-group">
                                <label>Tratamento:</label>
                                <input type="text" name="tratamento" defaultValue={editingItem.tratamento} />
                            </div>
                            <div className="form-group">
                                <label>Sacaria:</label>
                                <input type="text" name="sacaria" defaultValue={editingItem.sacaria} />
                            </div>
                            <div className="form-group">
                                <label>Qtd. Lastro:</label>
                                <input type="number" name="quantidade_lastro" defaultValue={editingItem.quantidade_lastro} />
                            </div>
                            <div className="form-group">
                                <label>Qtd. Palete:</label>
                                <input type="number" name="quantidade_palete" defaultValue={editingItem.quantidade_palete} />
                            </div>
                            <div className="form-group">
                                <label>Total Lote:</label>
                                <input type="number" name="total_lote" defaultValue={editingItem.total_lote} />
                            </div>
                            <div className="form-group">
                                <label>Local Armazenado:</label>
                                <input type="text" name="local_armazenado" defaultValue={editingItem.local_armazenado} />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="save-button">Salvar</button>
                                <button type="button" onClick={closeModal} className="cancel-button">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}