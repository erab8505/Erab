using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrders_Employees_LaboratoristId",
                table: "StudyOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrders_Employees_RequestingDoctorId",
                table: "StudyOrders");

            migrationBuilder.CreateTable(
                name: "CompanyFeatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FeatureKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ConfigValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyFeatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyFeatures_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyFeatures_CompanyId_FeatureKey",
                table: "CompanyFeatures",
                columns: new[] { "CompanyId", "FeatureKey" },
                unique: true);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrders_Employees_LaboratoristId",
                table: "StudyOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrders_Employees_RequestingDoctorId",
                table: "StudyOrders");

            migrationBuilder.DropTable(
                name: "CompanyFeatures");

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrders_Employees_LaboratoristId",
                table: "StudyOrders",
                column: "LaboratoristId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrders_Employees_RequestingDoctorId",
                table: "StudyOrders",
                column: "RequestingDoctorId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
