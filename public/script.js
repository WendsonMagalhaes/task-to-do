document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("task-input");
    const addTaskButton = document.getElementById("add-task-button");
    const taskList = document.getElementById("task-list");
    const taskCountToday = document.getElementById('task-count-today');


    function obterValorDoSelect(idSelect) {
        var select = document.getElementById(idSelect);
        return select.options[select.selectedIndex].value;
    }

    addTaskButton.addEventListener("click", addTask);
    taskList.addEventListener("click", handleTaskClick);

    // Variável para armazenar a data selecionada no calendário
    let selectedDate = null;

    function addTask() {
        const task = taskInput.value.trim();
        const date = selectedDate || new Date().toISOString().split('T')[0]; // Usa a data selecionada ou a data atual
        const priority = obterValorDoSelect('priority');
    
        if (task) {
            fetch('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task, date, priority, completed: false })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showAlert('danger', data.error);
                    } else {
                        const taskItem = document.createElement("li");
                        taskItem.dataset.id = data.id;
                        taskItem.dataset.priority = data.priority; // Adiciona o atributo de prioridade
    
                        const starContainer = document.createElement("div");
                        starContainer.classList.add("star-container");
                        taskItem.innerHTML = `${formatDate(data.date)}`;
    
                        if (priority == 3) {
                            starContainer.innerHTML += '<i class="fa fa-star priority-star"></i>';
    
                        } else if (priority == 2) {
                            starContainer.innerHTML += '<i class="fa fa-star priority-star"></i><i class="fa fa-star priority-star"></i>';
    
                        } else {
                            starContainer.innerHTML += '<i class="fa fa-star priority-star"></i><i class="fa fa-star priority-star"></i><i class="fa fa-star priority-star"></i>';
                        }
    
                        // Adicionando starContainer dentro de taskItem
                        taskItem.appendChild(starContainer);
    
                        // Adicionando o restante do conteúdo de taskItem
                        taskItem.innerHTML += `${data.task}`;
    
                        const buttonContainer = document.createElement("div");
                        buttonContainer.classList.add("button-container");
    
                        const completeButton = document.createElement("button");
                        completeButton.innerHTML = data.completed ? '<i class="fas fa-redo"></i>' : '<i class="fas fa-check"></i>';
                        completeButton.addEventListener("click", () => {
                            toggleTaskCompletion(data.id, !data.completed);
                        });
                        completeButton.classList.add("complete-button");
    
                        const deleteButton = document.createElement("button");
                        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                        deleteButton.addEventListener("click", () => {
                            deleteTask(data.id);
                        });
                        deleteButton.classList.add("delete-button");
    
                        buttonContainer.appendChild(completeButton);
                        buttonContainer.appendChild(deleteButton);
    
                        taskItem.appendChild(buttonContainer);
    
                        // Adiciona a nova tarefa na lista
                        taskList.appendChild(taskItem);
    
                        // Ordena as tarefas novamente com base na prioridade e status de conclusão
                        const sortedTasks = Array.from(taskList.children).sort((a, b) => {
                            const aCompleted = a.classList.contains('completed');
                            const bCompleted = b.classList.contains('completed');
                            
                            // Ordena primeiro pelo status de completude (concluídas por último)
                            if (aCompleted && !bCompleted) return 1;
                            if (!aCompleted && bCompleted) return -1;
    
                            // Se ambas forem concluídas ou não, ordena pela prioridade crescente
                            return a.dataset.priority - b.dataset.priority;
                        });
    
                        // Limpa a lista e adiciona as tarefas ordenadas novamente
                        taskList.innerHTML = '';
                        sortedTasks.forEach(task => taskList.appendChild(task));
    
                        // Atualiza as estatísticas de tarefas após adicionar a tarefa
                        const totalTasks = document.querySelectorAll('#task-list li').length;
                        const completedTasks = document.querySelectorAll('#task-list li.completed').length;
                        updateTaskCount(totalTasks, completedTasks);
    
                        taskInput.value = "";
                        showAlert('success', 'Tarefa adicionada com sucesso!');
                    }
                })
                .catch(err => {
                    console.error('Erro ao adicionar tarefa:', err);
                    showAlert('danger', 'Erro ao adicionar a tarefa.');
                });
        }
    }
    

    function handleTaskClick(event) {
        const targetButton = event.target.closest("button");
        const taskItem = targetButton.closest("li");
        const taskId = taskItem.dataset.id;

        if (!taskItem) return;

        if (targetButton.innerHTML.includes("fa-trash")) {
            deleteTask(taskId);
        } else if (targetButton.innerHTML.includes("fa-check") || targetButton.innerHTML.includes("fa-redo")) {
            const completed = !taskItem.classList.contains("completed");
            toggleTaskCompletion(taskId, completed);
        }
    }

    function toggleTaskCompletion(taskId, completed) {
        fetch(`/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao completar tarefa');
            }
            return response.json();
        })
        .then(data => {
            const taskItem = document.querySelector(`li[data-id="${taskId}"]`);
            const taskList = document.getElementById("task-list");
    
            // Atualiza a classe "completed" no item da tarefa
            taskItem.classList.toggle("completed", completed);
    
            // Atualiza os botões de ação (completeButton e deleteButton)
            const buttonContainer = taskItem.querySelector(".button-container");
            buttonContainer.innerHTML = '';
    
            if (completed) {
                // Adiciona o botão de reabrir
                const reopenButton = document.createElement("button");
                reopenButton.innerHTML = '<i class="fas fa-redo"></i>';
                reopenButton.addEventListener("click", () => {
                    toggleTaskCompletion(taskId, false);
                });
                reopenButton.classList.add("reopen-button");
                buttonContainer.appendChild(reopenButton);
    
                // Move a tarefa para o final da lista
                taskList.appendChild(taskItem);
            } else {
                // Adiciona os botões de completar e deletar
                const completeButton = document.createElement("button");
                completeButton.innerHTML = '<i class="fas fa-check"></i>';
                completeButton.addEventListener("click", () => {
                    toggleTaskCompletion(taskId, true);
                });
                completeButton.classList.add("complete-button");
                buttonContainer.appendChild(completeButton);
    
                const deleteButton = document.createElement("button");
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.addEventListener("click", () => {
                    deleteTask(taskId);
                });
                deleteButton.classList.add("delete-button");
                buttonContainer.appendChild(deleteButton);
    
                // Atualiza a posição da tarefa na lista de acordo com a prioridade
                const tasks = Array.from(taskList.querySelectorAll('li'));
                tasks.push(taskItem); // Adiciona a tarefa reaberta na lista temporária
    
                tasks.sort((a, b) => {
                    const aPriority = a.classList.contains('completed') ? -1 : parseInt(a.querySelector('.star-container').childElementCount);
                    const bPriority = b.classList.contains('completed') ? -1 : parseInt(b.querySelector('.star-container').childElementCount);
    
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority; // Ordena por prioridade decrescente
                    } else {
                        return parseInt(b.dataset.id) - parseInt(a.dataset.id); // Em caso de empate na prioridade, mantém a ordem original de inserção
                    }
                });
    
                tasks.forEach(task => {
                    taskList.appendChild(task); // Reinsere na ordem correta
                });
            }
    
            // Atualiza a contagem de tarefas após completar a operação
            const totalTasks = document.querySelectorAll('#task-list li').length;
            const completedTasks = document.querySelectorAll('#task-list li.completed').length;
            updateTaskCount(totalTasks, completedTasks);
        })
        .catch(err => console.error('Erro ao completar tarefa:', err));
    }
    


    function loadTasks(selectedDate) {
        fetch(`/tasks?date=${selectedDate}`)
            .then(response => response.json())
            .then(data => {

                const sortedTasks = data.tasks.sort((a, b) => {
                    // Ordena primeiro pelo status de completude (concluídas por último)
                    if (a.completed && !b.completed) return 1;
                    if (!a.completed && b.completed) return -1;

                    // Se ambas forem concluídas ou não, ordena pela prioridade crescente
                    return a.priority - b.priority;
                });

                const taskList = document.getElementById("task-list");
                taskList.innerHTML = '';

                let totalTasks = 0; // Variável para contar o total de tarefas
                let completedTasks = 0; // Variável para contar o total de tarefas concluídas

                data.tasks.forEach(task => {
                    if (task.date === selectedDate) {
                        totalTasks++; // Incrementa o total de tarefas

                        const taskItem = document.createElement("li");

                        taskItem.dataset.id = task.id;
                        const starContainer = document.createElement("div");
                        starContainer.classList.add("star-container");
                        taskItem.innerHTML = `${formatDate(task.date)}`;
                        if (task.priority == 3) {
                            starContainer.innerHTML += '<i class="fa fa-star priority-star"></i>';

                        } else if (task.priority == 2) {
                            starContainer.innerHTML += '<i class="fa fa-star priority-star"></i><i class="fa fa-star priority-star"></i>';

                        } else {
                            starContainer.innerHTML += '<i class="fa fa-star priority-star"></i><i class="fa fa-star priority-star"></i><i class="fa fa-star priority-star"></i>';

                        }
                        // Adicionando newElement dentro de taskItem
                        taskItem.appendChild(starContainer);

                        // Adicionando o restante do conteúdo de taskItem
                        taskItem.innerHTML += `${task.task}`;

                        const buttonContainer = document.createElement("div");
                        buttonContainer.classList.add("button-container");

                        if (task.completed) {
                            taskItem.classList.add("completed");
                            completedTasks++; // Incrementa o total de tarefas concluídas

                            const reopenButton = document.createElement("button");
                            reopenButton.innerHTML = '<i class="fas fa-redo"></i>';
                            reopenButton.addEventListener("click", () => {
                                toggleTaskCompletion(task.id, false);
                            });
                            reopenButton.classList.add("reopen-button");
                            buttonContainer.appendChild(reopenButton);
                        } else {
                            const completeButton = document.createElement("button");
                            completeButton.innerHTML = '<i class="fas fa-check"></i>';
                            completeButton.addEventListener("click", () => {
                                toggleTaskCompletion(task.id, true);
                            });
                            completeButton.classList.add("complete-button");
                            buttonContainer.appendChild(completeButton);

                            const deleteButton = document.createElement("button");
                            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                            deleteButton.addEventListener("click", () => {
                                deleteTask(task.id);
                            });
                            deleteButton.classList.add("delete-button");
                            buttonContainer.appendChild(deleteButton);
                        }

                        taskItem.appendChild(buttonContainer);
                        taskList.appendChild(taskItem);
                    }
                });

                // Atualiza a contagem de tarefas na interface
                updateTaskCount(totalTasks, completedTasks);
            })
            .catch(err => console.error('Erro ao carregar tarefas:', err));
    }


    function formatDate(dateString) {
        if (!dateString) return "";
        const parts = dateString.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) {
            console.error('Data inválida:', dateString);
            return "";
        }
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('pt-BR', options);
    }

    function deleteTask(taskId) {
        fetch(`/tasks/${taskId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao excluir tarefa');
                }
                return response.json();
            })
            .then(() => {
                const taskItem = document.querySelector(`li[data-id="${taskId}"]`);
                if (taskItem && taskItem.parentNode) {
                    taskItem.parentNode.removeChild(taskItem);
                    // Atualiza a contagem de tarefas
                    const totalTasks = document.querySelectorAll('#task-list li').length;
                    const completedTasks = document.querySelectorAll('#task-list li.completed').length;
                    updateTaskCount(totalTasks, completedTasks);
                } else {
                    console.warn('Elemento da tarefa não encontrado ou já removido do DOM');
                }

            })
            .catch(err => console.error('Erro ao excluir tarefa:', err));
    }

    function initializeCalendar() {
        var calendarEl = document.getElementById('calendar');

        if (calendarEl) {
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'pt-br',
                events: [],
                selectable: true,
                select: function (info) {
                    selectedDate = info.startStr;
                    loadTasks(selectedDate);
                    console.log(selectedDate);
                },
                dateClick: function (info) {
                    // Remove a seleção anterior
                    var previouslySelected = document.querySelector('.fc-day-selected');
                    if (previouslySelected) {
                        previouslySelected.classList.remove('fc-day-selected');
                    }

                    // Adiciona a classe de dia selecionado ao dia clicado
                    info.dayEl.classList.add('fc-day-selected');
                }
            });

            calendar.render();

            if (selectedDate) {
                calendar.gotoDate(selectedDate);
            } else {
                calendar.today();
                selectedDate = calendar.getDate().toISOString().split('T')[0];
                loadTasks(selectedDate); // Carrega tarefas para a data inicial
            }

            // Atualiza as tarefas quando mudar de data no calendário
            calendar.on('dateClick', function (info) {
                selectedDate = info.dateStr;
                loadTasks(selectedDate);
            });
        } else {
            console.error('Elemento #calendar não encontrado.');
        }
    }

    initializeCalendar();



    const cardContainer = document.getElementById("card-container");

    // Função para carregar os cartões
    function loadCards() {
        fetch('/cards')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Erro ao obter cartões:', data.error);
                    return;
                }

                // Limpar o conteúdo anterior dos cartões
                cardContainer.innerHTML = '';

                // Adicionar cada cartão ao DOM
                data.cards.forEach(card => {
                    const cardItem = document.createElement("div");
                    cardItem.dataset.id = card.id;
                    cardItem.textContent = card.title;

                    const editButton = document.createElement("button");
                    editButton.textContent = "Editar";
                    editButton.addEventListener("click", () => {
                        // Implemente a lógica para editar o cartão, se necessário
                    });

                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Excluir";
                    deleteButton.addEventListener("click", () => {
                        deleteCard(card.id);
                    });

                    cardItem.appendChild(editButton);
                    cardItem.appendChild(deleteButton);
                    cardContainer.appendChild(cardItem);
                });
            })
            .catch(err => {
                console.error('Erro ao carregar cartões:', err);
            });
    }

    // Chamada inicial para carregar os cartões ao carregar a página
    loadCards();

    // Função para criar um novo cartão
    function createCard(title) {
        fetch('/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showAlert('danger', data.error);
                } else {
                    const cardItem = document.createElement("div");
                    cardItem.dataset.id = data.id;
                    cardItem.textContent = data.title;

                    const editButton = document.createElement("button");
                    editButton.textContent = "Editar";
                    editButton.addEventListener("click", () => {
                        // Implemente a lógica para editar o cartão, se necessário
                    });

                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Excluir";
                    deleteButton.addEventListener("click", () => {
                        deleteCard(data.id);
                    });

                    cardItem.appendChild(editButton);
                    cardItem.appendChild(deleteButton);
                    cardContainer.appendChild(cardItem); // Certifique-se de ter um elemento correto para adicionar o cartão
                    showAlert('success', 'Cartão adicionado com sucesso!');
                }
            })
            .catch(err => {
                console.error('Erro ao adicionar cartão:', err);
                showAlert('danger', 'Erro ao adicionar o cartão.');
            });
    }

    // Evento para adicionar um novo cartão
    const addCardButton = document.getElementById("add-card-button");
    addCardButton.addEventListener("click", () => {
        const title = prompt("Digite o título do novo cartão:");
        if (title) {
            createCard(title);
        }
    });

    // Função para deletar um cartão
    function deleteCard(cardId) {
        fetch(`/cards/${cardId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao excluir cartão');
                }
                return response.json();
            })
            .then(() => {
                const cardItem = document.querySelector(`div[data-id="${cardId}"]`);
                if (cardItem && cardItem.parentNode) {
                    cardItem.parentNode.removeChild(cardItem);
                } else {
                    console.warn('Elemento do cartão não encontrado ou já removido do DOM');
                }
            })
            .catch(err => console.error('Erro ao excluir cartão:', err));
    }
    function showAlert(type, message) {
        const alertContainer = document.getElementById('alert-container');
        alertContainer.textContent = message;
        alertContainer.style.display = 'block';

        // Defina uma cor de fundo com base no tipo de alerta
        if (type === 'success') {
            alertContainer.style.backgroundColor = '#d4edda';
            alertContainer.style.color = '#155724';
            alertContainer.style.borderColor = '#c3e6cb';
        } else if (type === 'danger') {
            alertContainer.style.backgroundColor = '#f8d7da';
            alertContainer.style.color = '#721c24';
            alertContainer.style.borderColor = '#f5c6cb';
        }

        // Esconder o alerta após 3 segundos (opcional)
        setTimeout(() => {
            alertContainer.style.display = 'none';
        }, 1000);
    }


    const cardTitleInput = document.getElementById('card-title-input');
    const adddCardButton = document.getElementById('add-card-button');
    const cardList = document.getElementById('card-list');

    adddCardButton.addEventListener('click', function () {
        if (cardTitleInput.value.trim() === '') {
            showAlert('danger', 'O título do cartão não pode estar vazio.');
            return;
        }

        const card = document.createElement('div');
        card.textContent = cardTitleInput.value;
        card.className = 'card';
        cardList.appendChild(card);

        cardTitleInput.value = '';
        showAlert('success', 'Cartão adicionado com sucesso!');
    });


    function updateTaskStats() {
        const tasks = document.querySelectorAll('#card-list .card');
        const completedTasks = document.querySelectorAll('#card-list .card.completed');

        const totalTasks = tasks.length;
        const totalCompletedTasks = completedTasks.length;
        const totalIncompleteTasks = totalTasks - totalCompletedTasks;

        const percentage = totalTasks === 0 ? 0 : (totalCompletedTasks / totalTasks) * 100;

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = totalCompletedTasks;
        document.getElementById('incomplete-tasks').textContent = totalIncompleteTasks;
        document.getElementById('completion-percentage').textContent = `${percentage.toFixed(2)}%`;
    }


    function updateTaskCount(totalTasks, completedTasks) {
        const taskCountElement = document.getElementById("task-count");
        const completedCountElement = document.getElementById("completed-count");
        const notCompletedCountElement = document.getElementById("not-completed-count");
        const percentageElement = document.getElementById("completion-percentage");
        const totalActivitiesElement = document.getElementById("total-activities");

        taskCountElement.textContent = totalTasks;
        completedCountElement.textContent = completedTasks;
        notCompletedCountElement.textContent = totalTasks - completedTasks;

        const percentage = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
        percentageElement.textContent = `${percentage}%`;

    }


});
