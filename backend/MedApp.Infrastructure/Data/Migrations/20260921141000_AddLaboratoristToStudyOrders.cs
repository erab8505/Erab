using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLaboratoristToStudyOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LaboratoristId",
                table: "StudyOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LaboratoristName",
                table: "StudyOrders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LaboratoristId",
                table: "StudyOrders");

            migrationBuilder.DropColumn(
                name: "LaboratoristName",
                table: "StudyOrders");
        }
    }
}
