"use strict";

class AppointmentManager {
    constructor() {
        this.appointments = [];
        this.loadAppointments();
        this.initializeEventListeners();
        this.checkLoginStatus();
    }

    initializeEventListeners() {
        const todayBtn = document.getElementById('todayBtn');
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document?.getElementById('logout');
        const appointmentForm = document.getElementById('appointmentForm');
        const appointmentsTable = document.getElementById('appointmentsTable');

        todayBtn?.addEventListener('click', () => this.filterTodayAppointments());
        newAppointmentBtn?.addEventListener('click', () => this.openNewAppointmentModal());
        loginBtn?.addEventListener('click', () => this.login());
        logoutBtn?.addEventListener('click', () => this.logout());
        appointmentForm?.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));
        appointmentsTable?.addEventListener('click', (e) => this.handleTableActions(e));
    }

    checkLoginStatus() {
        const isLoggedIn = sessionStorage.getItem('token') !== null;
        this.updateUIForLoginStatus(isLoggedIn);
    }

    updateUIForLoginStatus(isLoggedIn) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logout');
        const appointmentSection = document.getElementById('appointmentSection');

        if (isLoggedIn) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            appointmentSection.style.display = 'block';
        } else {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            appointmentSection.style.display = 'none';
        }
    }

    login() {
        sessionStorage.setItem('token', 'dummy_token');
        sessionStorage.setItem('email', 'user@example.com');
        sessionStorage.setItem('role', 'user');
        this.updateUIForLoginStatus(true);
    }

    logout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('role');
        window.location.href = "/Home"
        this.updateUIForLoginStatus(false);
    }

    async handleTableActions(e) {
        if (e.target.closest('.edit-btn')) {
            const editBtn = e.target.closest('.edit-btn');
            const appointmentId = editBtn.dataset.id;
            this.openEditAppointmentModal(appointmentId);
        } else if (e.target.closest('.delete-btn')) {
            const deleteBtn = e.target.closest('.delete-btn');
            const appointmentId = deleteBtn.dataset.id;
            await this.deleteAppointment(appointmentId);
        }
    }

    async loadAppointments() {
        try {
            const response = await fetch('http://localhost:3000/appointment/getAll');
            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }
            this.appointments = await response.json();
            this.renderAppointments();
        } catch (error) {
            console.error('Error loading appointments:', error);
            alert('Failed to load appointments. Please try again.');
        }
    }

    renderAppointments() {
      
        const tableBody = document.getElementById('appointmentsTable');
        if (tableBody) {
            tableBody.innerHTML = this.appointments.map(appointment => `
                <tr>
                    <td>${appointment.patientName}</td>
                    <td>${appointment.email}</td>
                    <td>${appointment.phoneNumber}</td>
                    <td>${appointment.doctorName}</td>
                    <td>${appointment.date}</td>
                    <td>${appointment.time}</td>
                    <td class="status">
                        <button class="btn btn-sm btn-link text-primary edit-btn" data-id="${appointment._id}" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-danger delete-btn" data-id="${appointment._id}" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    filterTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        const filteredAppointments = this.appointments.filter(appointment => appointment.date === today);
        this.appointments = filteredAppointments;
        this.renderAppointments();
    }

    openNewAppointmentModal() {
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.reset();
            delete form.dataset.appointmentId; // Remove any existing appointment ID
        }
        const modalElement = document.getElementById('appointmentModal');
        if (modalElement) {
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        }
    }

    openEditAppointmentModal(appointmentId) {
        const appointment = this.appointments.find(app => app._id === appointmentId);

        if (!appointment) {
            alert("Appointment not found");
            return;
        }

        const form = document.getElementById('appointmentForm');
        if (form) {
            form.elements['patientName'].value = appointment.patientName;
            form.elements['email'].value = appointment.email;
            form.elements['phoneNumber'].value = appointment.phoneNumber;
            form.elements['doctorName'].value = appointment.doctorName;
            form.elements['date'].value = appointment.date;
            form.elements['time'].value = appointment.time;

            form.dataset.appointmentId = appointmentId;
        }

        const modalElement = document.getElementById('appointmentModal');
        if (modalElement) {
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        }
    }

    async handleAppointmentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const appointmentData = Object.fromEntries(formData.entries());

        const phoneRegex = /^\+251[1-9]\d{8}$/;
        if (!phoneRegex.test(appointmentData.phoneNumber)) {
            alert("Please enter a valid Ethiopian phone number (e.g., +251912345678)");
            return;
        }

        const appointmentId = form.dataset.appointmentId;

        try {
            let response;
            if (appointmentId) {
                console.log(appointmentId);
                response = await fetch(`http://localhost:3000/appointment/${appointmentId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData),
                });
            } else {
                response = await fetch('http://localhost:3000/appointment/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData),
                });
            }

            if (!response.ok) {
                throw new Error(appointmentId ? 'Failed to update appointment' : 'Failed to create appointment');
            }

            const updatedAppointment = await response.json();

            if (appointmentId) {
                this.appointments = this.appointments.map(app => app._id === appointmentId ? updatedAppointment : app);
            } else {
                this.appointments.push(updatedAppointment);
            }

            this.renderAppointments();

            const modalElement = document.getElementById('appointmentModal');
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
            }

            form.reset();
            delete form.dataset.appointmentId;
        } catch (error) {
            console.error('Error submitting appointment:', error);
            alert('Failed to submit appointment. Please try again.');
        }
        window.location.reload();
    }

    async deleteAppointment(id) {
        try {
            const response = await fetch(`http://localhost:3000/appointment/delete?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete appointment');
            }

            const result = await response.json();
            if (result.success) {
                this.appointments = this.appointments.filter(app => app._id !== id);
                this.renderAppointments();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Failed to delete appointment. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AppointmentManager();
});