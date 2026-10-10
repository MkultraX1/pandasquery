import { Dataset } from './types';

export const SAMPLE_DATASETS: Dataset[] = [
  {
    id: 'sales',
    name: 'Desempenho de Vendas (Sales)',
    description: 'Dados de vendas mensais com vendedores, regiões, produtos, quantidades e preços.',
    columns: [
      { name: 'ID_Venda', type: 'number' },
      { name: 'Data', type: 'date' },
      { name: 'Vendedor', type: 'string' },
      { name: 'Regiao', type: 'string' },
      { name: 'Produto', type: 'string' },
      { name: 'Quantidade', type: 'number' },
      { name: 'Preco_Unitario', type: 'number' },
      { name: 'Desconto', type: 'number' },
    ],
    data: [
      { ID_Venda: 1001, Data: '2026-01-10', Vendedor: 'Carlos Silva', Regiao: 'Sudeste', Produto: 'Teclado Mecânico', Quantidade: 5, Preco_Unitario: 150.00, Desconto: 10.00 },
      { ID_Venda: 1002, Data: '2026-01-12', Vendedor: 'Ana Costa', Regiao: 'Sul', Produto: 'Mouse Sem Fio', Quantidade: 12, Preco_Unitario: 89.90, Desconto: 0.00 },
      { ID_Venda: 1003, Data: '2026-01-12', Vendedor: 'Carlos Silva', Regiao: 'Sudeste', Produto: 'Mouse Sem Fio', Quantidade: null, Preco_Unitario: 89.90, Desconto: 5.00 }, // Row with missing Quantidade
      { ID_Venda: 1004, Data: '2026-01-14', Vendedor: 'Bruno Melo', Regiao: 'Nordeste', Produto: 'Monitor 24"', Quantidade: 2, Preco_Unitario: 899.00, Desconto: 50.00 },
      { ID_Venda: 1005, Data: '2026-01-15', Vendedor: 'Paula Souza', Regiao: 'Centro-Oeste', Produto: 'Teclado Mecânico', Quantidade: 8, Preco_Unitario: 150.00, Desconto: null }, // Row with missing Desconto
      { ID_Venda: 1006, Data: '2026-01-16', Vendedor: 'Ana Costa', Regiao: 'Sul', Produto: 'Webcam HD', Quantidade: 4, Preco_Unitario: 199.90, Desconto: 15.00 },
      { ID_Venda: 1007, Data: '2026-01-18', Vendedor: 'Bruno Melo', Regiao: 'Nordeste', Produto: 'Teclado Mecânico', Quantidade: 1, Preco_Unitario: 150.00, Desconto: 0.00 },
      { ID_Venda: 1008, Data: '2026-01-20', Vendedor: 'Paula Souza', Regiao: 'Centro-Oeste', Produto: 'Monitor 24"', Quantidade: 3, Preco_Unitario: 899.00, Desconto: 100.00 },
      { ID_Venda: 1009, Data: '2026-01-20', Vendedor: 'Carlos Silva', Regiao: 'Sudeste', Produto: 'Monitor 24"', Quantidade: 2, Preco_Unitario: 899.00, Desconto: 0.00 },
      { ID_Venda: 1009, Data: '2026-01-20', Vendedor: 'Carlos Silva', Regiao: 'Sudeste', Produto: 'Monitor 24"', Quantidade: 2, Preco_Unitario: 899.00, Desconto: 0.00 }, // Duplicate row
      { ID_Venda: 1011, Data: '2026-01-22', Vendedor: 'Ana Costa', Regiao: 'Sul', Produto: 'Teclado Mecânico', Quantidade: 10, Preco_Unitario: 150.00, Desconto: 20.00 },
      { ID_Venda: 1012, Data: '2026-01-25', Vendedor: 'Bruno Melo', Regiao: 'Nordeste', Produto: 'Mouse Sem Fio', Quantidade: 15, Preco_Unitario: 89.90, Desconto: 15.00 },
    ],
  },
  {
    id: 'employees',
    name: 'Recursos Humanos (Employees)',
    description: 'Cadastro de funcionários com cargo, salário, departamento e data de contratação.',
    columns: [
      { name: 'ID_Funcionario', type: 'number' },
      { name: 'Nome', type: 'string' },
      { name: 'Departamento', type: 'string' },
      { name: 'Cargo', type: 'string' },
      { name: 'Salario', type: 'number' },
      { name: 'Data_Admissao', type: 'date' },
      { name: 'Ativo', type: 'boolean' },
    ],
    data: [
      { ID_Funcionario: 1, Nome: 'Carlos Silva', Departamento: 'Vendas', Cargo: 'Executivo Sênior', Salario: 7800.00, Data_Admissao: '2021-03-15', Ativo: true },
      { ID_Funcionario: 2, Nome: 'Ana Costa', Departamento: 'Vendas', Cargo: 'Gerente Regional Sul', Salario: 8400.00, Data_Admissao: '2020-06-01', Ativo: true },
      { ID_Funcionario: 3, Nome: 'Bruno Melo', Departamento: 'Vendas', Cargo: 'Especialista de Contas', Salario: 6100.00, Data_Admissao: '2022-01-10', Ativo: true },
      { ID_Funcionario: 4, Nome: 'Paula Souza', Departamento: 'Vendas', Cargo: 'Consultora Comercial', Salario: 5900.00, Data_Admissao: '2023-08-20', Ativo: true },
      { ID_Funcionario: 5, Nome: 'Mariana Azevedo', Departamento: 'Tecnologia', Cargo: 'Engenheira de Dados', Salario: 9200.00, Data_Admissao: '2022-03-15', Ativo: true },
      { ID_Funcionario: 6, Nome: 'Rodrigo Alves', Departamento: 'Vendas', Cargo: 'Gerente de Contas', Salario: 6200.00, Data_Admissao: '2021-06-01', Ativo: true },
      { ID_Funcionario: 7, Nome: 'Clara Rodrigues', Departamento: 'Tecnologia', Cargo: 'Cientista de Dados', Salario: 9500.00, Data_Admissao: '2021-10-18', Ativo: true },
      { ID_Funcionario: 8, Nome: 'Roberto Santos', Departamento: 'Financeiro', Cargo: 'Analista Financeiro', Salario: null, Data_Admissao: '2022-05-12', Ativo: false }, // Row with missing Salario
      { ID_Funcionario: 9, Nome: 'Patrícia Rocha', Departamento: 'Marketing', Cargo: 'Designer UX/UI', Salario: 5200.00, Data_Admissao: '2023-04-04', Ativo: true },
      { ID_Funcionario: 9, Nome: 'Patrícia Rocha', Departamento: 'Marketing', Cargo: 'Designer UX/UI', Salario: 5200.00, Data_Admissao: '2023-04-04', Ativo: true }, // Duplicate row
    ],
  },
  {
    id: 'inventory',
    name: 'Estoque de Produtos (Inventory)',
    description: 'Status de produtos em estoque, custos, preços de venda e nível de reposição.',
    columns: [
      { name: 'SKU', type: 'string' },
      { name: 'Nome_Produto', type: 'string' },
      { name: 'Categoria', type: 'string' },
      { name: 'Estoque_Atual', type: 'number' },
      { name: 'Estoque_Minimo', type: 'number' },
      { name: 'Preco_Custo', type: 'number' },
      { name: 'Preco_Venda', type: 'number' },
    ],
    data: [
      { SKU: 'PROD-001', Nome_Produto: 'Teclado Mecânico', Categoria: 'Periféricos', Estoque_Atual: 45, Estoque_Minimo: 15, Preco_Custo: 85.00, Preco_Venda: 150.00 },
      { SKU: 'PROD-002', Nome_Produto: 'Mouse Sem Fio', Categoria: 'Periféricos', Estoque_Atual: 80, Estoque_Minimo: 20, Preco_Custo: 42.00, Preco_Venda: 89.90 },
      { SKU: 'PROD-003', Nome_Produto: 'Monitor 24"', Categoria: 'Monitores', Estoque_Atual: 14, Estoque_Minimo: 10, Preco_Custo: 540.00, Preco_Venda: 899.00 },
      { SKU: 'PROD-004', Nome_Produto: 'Webcam HD', Categoria: 'Vídeo', Estoque_Atual: 28, Estoque_Minimo: 10, Preco_Custo: 110.00, Preco_Venda: 199.90 },
      { SKU: 'PROD-005', Nome_Produto: 'Mesa Dobrável de Madeira', Categoria: 'Móveis', Estoque_Atual: 3, Estoque_Minimo: 5, Preco_Custo: 180.00, Preco_Venda: null }, // Missing Price
      { SKU: 'PROD-006', Nome_Produto: 'Fone de Ouvido Bluetooth', Categoria: 'Áudio', Estoque_Atual: 85, Estoque_Minimo: 20, Preco_Custo: 75.00, Preco_Venda: 189.90 },
      { SKU: 'PROD-007', Nome_Produto: 'Mochila Impermeável Tech', Categoria: 'Acessórios', Estoque_Atual: null, Estoque_Minimo: 15, Preco_Custo: 90.00, Preco_Venda: 199.00 }, // Missing stock
    ],
  },
];
