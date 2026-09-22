using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateEmployeesAndMultiRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Prescriptions_Specialists_SpecialistId",
                table: "Prescriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Schedulings_Specialists_SpecialistId",
                table: "Schedulings");

            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrders_Specialists_SpecialistId",
                table: "StudyOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Receptionists_ReceptionistId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Specialists_SpecialistId",
                table: "Users");

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IdentificationNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    LicenseNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    JobTitle = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    SpecialtyId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Employees_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_Specialties_SpecialtyId",
                        column: x => x.SpecialtyId,
                        principalTable: "Specialties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeAvailabilities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    StartHour = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    EndHour = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeAvailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeAvailabilities_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Data migration: Specialists -> Employees
            migrationBuilder.Sql(@"
                IF OBJECT_ID('Specialists', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO Employees (Id, CompanyId, FirstName, LastName, IdentificationNumber, LicenseNumber, JobTitle, SpecialtyId, Email, Phone, IsActive, CreatedAt, UpdatedAt)
                    SELECT Id, CompanyId, FirstName, LastName, NULL, LicenseNumber, N'Especialista Médico', SpecialtyId, Email, Phone, IsActive, CreatedAt, UpdatedAt
                    FROM Specialists;
                END
            ");

            // Data migration: Receptionists -> Employees
            migrationBuilder.Sql(@"
                IF OBJECT_ID('Receptionists', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO Employees (Id, CompanyId, FirstName, LastName, IdentificationNumber, LicenseNumber, JobTitle, SpecialtyId, Email, Phone, IsActive, CreatedAt, UpdatedAt)
                    SELECT Id, CompanyId, FirstName, LastName, IdentificationNumber, NULL, N'Recepcionista', NULL, Email, Phone, IsActive, CreatedAt, UpdatedAt
                    FROM Receptionists
                    WHERE Id NOT IN (SELECT Id FROM Employees);
                END
            ");

            // Data migration: SpecialistAvailabilities -> EmployeeAvailabilities
            migrationBuilder.Sql(@"
                IF OBJECT_ID('SpecialistAvailabilities', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO EmployeeAvailabilities (Id, EmployeeId, DayOfWeek, StartHour, EndHour, CreatedAt, UpdatedAt)
                    SELECT Id, SpecialistId, DayOfWeek, StartHour, EndHour, CreatedAt, UpdatedAt
                    FROM SpecialistAvailabilities
                    WHERE SpecialistId IN (SELECT Id FROM Employees);
                END
            ");

            // Data migration: Users.Role -> UserRoles
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Users', 'Role') IS NOT NULL
                BEGIN
                    INSERT INTO UserRoles (Id, UserId, Role, CreatedAt, UpdatedAt)
                    SELECT NEWID(), Id, Role, CreatedAt, UpdatedAt
                    FROM Users
                    WHERE Role IS NOT NULL;
                END
            ");

            // Data migration: Users.ReceptionistId -> Users.SpecialistId (before rename to EmployeeId)
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Users', 'ReceptionistId') IS NOT NULL AND COL_LENGTH('Users', 'SpecialistId') IS NOT NULL
                BEGIN
                    UPDATE Users
                    SET SpecialistId = ReceptionistId
                    WHERE SpecialistId IS NULL AND ReceptionistId IS NOT NULL;
                END
            ");

            // Clean up any orphaned FK references in Prescriptions, Schedulings, Users, StudyOrders if they point to non-existent Employees
            migrationBuilder.Sql(@"
                UPDATE Prescriptions SET SpecialistId = NULL WHERE SpecialistId IS NOT NULL AND SpecialistId NOT IN (SELECT Id FROM Employees);
                UPDATE Schedulings SET SpecialistId = (SELECT TOP 1 Id FROM Employees WHERE CompanyId = Schedulings.CompanyId) WHERE SpecialistId NOT IN (SELECT Id FROM Employees);
                UPDATE Users SET SpecialistId = NULL WHERE SpecialistId IS NOT NULL AND SpecialistId NOT IN (SELECT Id FROM Employees);
                UPDATE StudyOrders SET SpecialistId = NULL WHERE SpecialistId IS NOT NULL AND SpecialistId NOT IN (SELECT Id FROM Employees);
            ");

            migrationBuilder.DropTable(
                name: "Receptionists");

            migrationBuilder.DropTable(
                name: "SpecialistAvailabilities");

            migrationBuilder.DropTable(
                name: "Specialists");

            migrationBuilder.DropIndex(
                name: "IX_Users_ReceptionistId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReceptionistId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "SpecialistId",
                table: "Users",
                newName: "EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_Users_SpecialistId",
                table: "Users",
                newName: "IX_Users_EmployeeId");

            migrationBuilder.RenameColumn(
                name: "SpecialistId",
                table: "StudyOrders",
                newName: "RequestingDoctorId");

            migrationBuilder.RenameIndex(
                name: "IX_StudyOrders_SpecialistId",
                table: "StudyOrders",
                newName: "IX_StudyOrders_RequestingDoctorId");

            migrationBuilder.RenameColumn(
                name: "SpecialistId",
                table: "Schedulings",
                newName: "EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_Schedulings_SpecialistId_ScheduledAt",
                table: "Schedulings",
                newName: "IX_Schedulings_EmployeeId_ScheduledAt");

            migrationBuilder.RenameColumn(
                name: "SpecialistId",
                table: "Prescriptions",
                newName: "EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_Prescriptions_SpecialistId",
                table: "Prescriptions",
                newName: "IX_Prescriptions_EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrders_LaboratoristId",
                table: "StudyOrders",
                column: "LaboratoristId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeAvailabilities_EmployeeId_DayOfWeek",
                table: "EmployeeAvailabilities",
                columns: new[] { "EmployeeId", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId_IdentificationNumber",
                table: "Employees",
                columns: new[] { "CompanyId", "IdentificationNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId_IsActive",
                table: "Employees",
                columns: new[] { "CompanyId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_SpecialtyId",
                table: "Employees",
                column: "SpecialtyId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId_Role",
                table: "UserRoles",
                columns: new[] { "UserId", "Role" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Prescriptions_Employees_EmployeeId",
                table: "Prescriptions",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Schedulings_Employees_EmployeeId",
                table: "Schedulings",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrders_Employees_LaboratoristId",
                table: "StudyOrders",
                column: "LaboratoristId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrders_Employees_RequestingDoctorId",
                table: "StudyOrders",
                column: "RequestingDoctorId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Employees_EmployeeId",
                table: "Users",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Prescriptions_Employees_EmployeeId",
                table: "Prescriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Schedulings_Employees_EmployeeId",
                table: "Schedulings");

            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrders_Employees_LaboratoristId",
                table: "StudyOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrders_Employees_RequestingDoctorId",
                table: "StudyOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Employees_EmployeeId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "EmployeeAvailabilities");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_StudyOrders_LaboratoristId",
                table: "StudyOrders");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "Users",
                newName: "SpecialistId");

            migrationBuilder.RenameIndex(
                name: "IX_Users_EmployeeId",
                table: "Users",
                newName: "IX_Users_SpecialistId");

            migrationBuilder.RenameColumn(
                name: "RequestingDoctorId",
                table: "StudyOrders",
                newName: "SpecialistId");

            migrationBuilder.RenameIndex(
                name: "IX_StudyOrders_RequestingDoctorId",
                table: "StudyOrders",
                newName: "IX_StudyOrders_SpecialistId");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "Schedulings",
                newName: "SpecialistId");

            migrationBuilder.RenameIndex(
                name: "IX_Schedulings_EmployeeId_ScheduledAt",
                table: "Schedulings",
                newName: "IX_Schedulings_SpecialistId_ScheduledAt");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "Prescriptions",
                newName: "SpecialistId");

            migrationBuilder.RenameIndex(
                name: "IX_Prescriptions_EmployeeId",
                table: "Prescriptions",
                newName: "IX_Prescriptions_SpecialistId");

            migrationBuilder.AddColumn<Guid>(
                name: "ReceptionistId",
                table: "Users",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Receptionists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IdentificationNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receptionists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Receptionists_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Specialists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpecialtyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LicenseNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Specialists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Specialists_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Specialists_Specialties_SpecialtyId",
                        column: x => x.SpecialtyId,
                        principalTable: "Specialties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SpecialistAvailabilities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpecialistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    EndHour = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    StartHour = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecialistAvailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpecialistAvailabilities_Specialists_SpecialistId",
                        column: x => x.SpecialistId,
                        principalTable: "Specialists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ReceptionistId",
                table: "Users",
                column: "ReceptionistId");

            migrationBuilder.CreateIndex(
                name: "IX_Receptionists_CompanyId",
                table: "Receptionists",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecialistAvailabilities_SpecialistId",
                table: "SpecialistAvailabilities",
                column: "SpecialistId");

            migrationBuilder.CreateIndex(
                name: "IX_Specialists_CompanyId_LicenseNumber",
                table: "Specialists",
                columns: new[] { "CompanyId", "LicenseNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Specialists_SpecialtyId",
                table: "Specialists",
                column: "SpecialtyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Prescriptions_Specialists_SpecialistId",
                table: "Prescriptions",
                column: "SpecialistId",
                principalTable: "Specialists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Schedulings_Specialists_SpecialistId",
                table: "Schedulings",
                column: "SpecialistId",
                principalTable: "Specialists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrders_Specialists_SpecialistId",
                table: "StudyOrders",
                column: "SpecialistId",
                principalTable: "Specialists",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Receptionists_ReceptionistId",
                table: "Users",
                column: "ReceptionistId",
                principalTable: "Receptionists",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Specialists_SpecialistId",
                table: "Users",
                column: "SpecialistId",
                principalTable: "Specialists",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
